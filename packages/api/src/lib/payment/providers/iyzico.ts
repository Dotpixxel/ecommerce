import { env } from "@raunk-butik/env/server";
import Iyzipay from "iyzipay";
import type {
	IPaymentProvider,
	PaymentCheckoutParams,
	PaymentCheckoutResult,
	PaymentRefundResult,
	PaymentVerifyResult,
} from "../types";

// ─── SDK singleton ────────────────────────────────────────────────────────────

export { Iyzipay };

export const iyzipay = new Iyzipay({
	apiKey: env.IYZICO_API_KEY ?? "",
	secretKey: env.IYZICO_SECRET_KEY ?? "",
	uri: env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com",
});

// ─── Low-level helpers (also exported for direct use in iyzico-callback.ts) ──

interface ExtendedItemTransaction {
	paymentTransactionId: string;
	paidPrice: string | number;
	refundedAmount?: string | number;
}

export interface RefundResult {
	status: string;
	errorCode?: string;
	errorMessage?: string;
	paymentId?: string;
}

export async function createRefundRequest(params: {
	paymentTransactionId: string;
	amount: number;
	conversationId: string;
}): Promise<RefundResult> {
	return new Promise((resolve) => {
		iyzipay.refund.create(
			{
				locale: Iyzipay.LOCALE.TR,
				conversationId: params.conversationId,
				price: params.amount.toFixed(2),
				currency: Iyzipay.CURRENCY.TRY,
				ip: "127.0.0.1",
				paymentTransactionId: params.paymentTransactionId,
			},
			(err, result) => {
				if (err) {
					resolve({ status: "failure", errorMessage: err.message });
				} else {
					resolve(result as RefundResult);
				}
			},
		);
	});
}

export async function createCancelRequest(params: {
	paymentId: string;
	conversationId: string;
}): Promise<RefundResult> {
	return new Promise((resolve) => {
		iyzipay.cancel.create(
			{
				locale: Iyzipay.LOCALE.TR,
				conversationId: params.conversationId,
				paymentId: params.paymentId,
				ip: "127.0.0.1",
			},
			(err, result) => {
				if (err) {
					resolve({ status: "failure", errorMessage: err.message });
				} else {
					resolve(result as RefundResult);
				}
			},
		);
	});
}

async function handleFullOrderRefundInternal(params: {
	paymentId: string;
	conversationId: string;
}): Promise<PaymentRefundResult> {
	// 1. Try Cancel (Void) — works same day before settlement
	const cancelResult = await createCancelRequest({
		paymentId: params.paymentId,
		conversationId: `${params.conversationId}-cancel`,
	});

	if (cancelResult.status === "success") {
		return {
			status: "success",
			message: "Ödeme başarıyla iptal edildi (Void).",
			providerResult: cancelResult,
		};
	}

	// 2. Fallback to Refund — works after settlement
	return new Promise((resolve) => {
		iyzipay.payment.retrieve(
			{
				locale: Iyzipay.LOCALE.TR,
				conversationId: `${params.conversationId}-retrieve`,
				paymentId: params.paymentId,
			},
			async (err, result) => {
				if (err || result.status !== "success") {
					return resolve({
						status: "failure",
						message: err?.message || "Ödeme detayı alınamadı",
					});
				}

				const itemTransactions = result.itemTransactions || [];
				if (itemTransactions.length === 0) {
					return resolve({
						status: "failure",
						message: "İade edilecek ürün bulunamadı.",
					});
				}

				const refundResults = [];
				for (const item of itemTransactions as unknown as ExtendedItemTransaction[]) {
					const paidPrice = Number(item.paidPrice);
					const refundedAmount = Number(item.refundedAmount || 0);

					if (refundedAmount < paidPrice) {
						const refundRes = await createRefundRequest({
							paymentTransactionId: item.paymentTransactionId,
							amount: paidPrice - refundedAmount,
							conversationId: `${params.conversationId}-refund-${item.paymentTransactionId}`,
						});
						refundResults.push(refundRes);
					}
				}

				const allSuccess = refundResults.every((r) => r.status === "success");
				if (allSuccess) {
					resolve({
						status: "success",
						message: "Ödeme başarıyla iade edildi (Refund).",
						providerResult: refundResults,
					});
				} else {
					const firstError = refundResults.find((r) => r.status !== "success");
					resolve({
						status: "failure",
						message:
							firstError?.errorMessage ||
							"Bazı ürünlerin iadesi başarısız oldu.",
						providerResult: refundResults,
					});
				}
			},
		);
	});
}

// ─── IPaymentProvider implementation ─────────────────────────────────────────

export class IyzicoProvider implements IPaymentProvider {
	async createCheckoutSession(
		params: PaymentCheckoutParams,
	): Promise<PaymentCheckoutResult> {
		const request = {
			locale: Iyzipay.LOCALE.TR,
			conversationId: crypto.randomUUID(),
			price: (params.totalAmount + params.shippingFee).toFixed(2),
			paidPrice: params.paidAmount.toFixed(2),
			currency: Iyzipay.CURRENCY.TRY,
			basketId: params.basketId,
			paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
			callbackUrl: params.callbackUrl,
			enabledInstallments: params.enabledInstallments ?? [2, 3, 6, 9],
			buyer: params.buyer,
			shippingAddress: params.shippingAddress,
			billingAddress: params.billingAddress,
			basketItems: params.items,
		};

		return new Promise((resolve) => {
			iyzipay.checkoutFormInitialize.create(
				request as unknown as Iyzipay.ThreeDSInitializePaymentRequestData,
				(err, result) => {
					if (err) {
						console.error("[Iyzico] SDK Error (initialize):", err);
						resolve({ status: "failure", errorMessage: err.message });
					} else if (result.status !== "success") {
						console.error("[Iyzico] Initialization Failed:", {
							errorCode: (result as { errorCode?: string }).errorCode,
							errorMessage: (result as { errorMessage?: string }).errorMessage,
						});
						resolve({
							status: "failure",
							errorMessage: (result as { errorMessage?: string }).errorMessage,
							raw: result as unknown as Record<string, unknown>,
						});
					} else {
						const r = result as unknown as Record<string, unknown>;
						resolve({
							status: "success",
							paymentUrl:
								(r["payWithIyzicoPageUrl"] as string) ||
								(r["paymentPageUrl"] as string),
							raw: r,
						});
					}
				},
			);
		});
	}

	async verifyPayment(token: string): Promise<PaymentVerifyResult> {
		return new Promise((resolve) => {
			iyzipay.checkoutForm.retrieve(
				{ locale: Iyzipay.LOCALE.TR, token },
				(err, result) => {
					const r = result as unknown as Record<string, unknown>;
					if (err) {
						resolve({ status: "failure", errorMessage: err.message });
					} else if (
						r["status"] !== "success" ||
						r["paymentStatus"] !== "SUCCESS"
					) {
						resolve({
							status: "failure",
							errorMessage: (r["errorMessage"] as string) || "Ödeme başarısız",
							raw: r,
						});
					} else {
						resolve({
							status: "success",
							paymentId: r["paymentId"] as string,
							basketId: r["basketId"] as string,
							raw: r,
						});
					}
				},
			);
		});
	}

	async cancelPayment(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult> {
		const result = await createCancelRequest(params);
		return {
			status: result.status,
			message:
				result.status === "success"
					? "Ödeme başarıyla iptal edildi."
					: (result.errorMessage ?? "İptal başarısız"),
			providerResult: result,
		};
	}

	async handleFullRefund(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult> {
		return handleFullOrderRefundInternal(params);
	}
}
