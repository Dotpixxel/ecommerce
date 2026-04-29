import { env } from "@raunk-butik/env/server";
import Stripe from "stripe";
import type {
	IPaymentProvider,
	PaymentCheckoutParams,
	PaymentCheckoutResult,
	PaymentRefundResult,
	PaymentVerifyResult,
} from "../types";

function getStripe(): Stripe {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error(
			"STRIPE_SECRET_KEY is not set. Configure it to use the Stripe payment provider.",
		);
	}
	return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
}

export class StripeProvider implements IPaymentProvider {
	async createCheckoutSession(
		params: PaymentCheckoutParams,
	): Promise<PaymentCheckoutResult> {
		try {
			const stripe = getStripe();

			// Build Stripe line_items from the provider-agnostic params
			const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
				params.items.map((item) => ({
					price_data: {
						currency: params.currency.toLowerCase(),
						product_data: { name: item.name },
						// price is already "unitPrice * quantity" as a string — convert to cents
						unit_amount: Math.round(Number(item.price) * 100),
					},
					quantity: 1, // price already includes quantity
				}));

			if (params.shippingFee > 0) {
				lineItems.push({
					price_data: {
						currency: params.currency.toLowerCase(),
						product_data: { name: "Kargo Ücreti" },
						unit_amount: Math.round(params.shippingFee * 100),
					},
					quantity: 1,
				});
			}

			// Derive success/cancel URLs from callbackUrl
			const base = new URL(params.callbackUrl).origin;

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				mode: "payment",
				line_items: lineItems,
				success_url: `${base}/checkout/success?orderId=${params.orderId}&session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${base}/checkout?error=İptal+edildi`,
				customer_email: params.buyer.email,
				metadata: {
					orderId: params.orderId,
					basketId: params.basketId,
				},
			});

			if (!session.url) {
				return { status: "failure", errorMessage: "Stripe session URL alınamadı" };
			}

			return {
				status: "success",
				paymentUrl: session.url,
				raw: session as unknown as Record<string, unknown>,
			};
		} catch (error) {
			console.error("[Stripe] createCheckoutSession error:", error);
			return {
				status: "failure",
				errorMessage: error instanceof Error ? error.message : "Stripe hatası",
			};
		}
	}

	async verifyPayment(sessionId: string): Promise<PaymentVerifyResult> {
		try {
			const stripe = getStripe();
			const session = await stripe.checkout.sessions.retrieve(sessionId);

			if (session.payment_status !== "paid") {
				return {
					status: "failure",
					errorMessage: `Ödeme tamamlanmadı: ${session.payment_status}`,
					raw: session as unknown as Record<string, unknown>,
				};
			}

			return {
				status: "success",
				paymentId: session.payment_intent as string,
				basketId: session.metadata?.basketId,
				raw: session as unknown as Record<string, unknown>,
			};
		} catch (error) {
			console.error("[Stripe] verifyPayment error:", error);
			return {
				status: "failure",
				errorMessage: error instanceof Error ? error.message : "Stripe hatası",
			};
		}
	}

	async cancelPayment(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult> {
		try {
			const stripe = getStripe();
			const refund = await stripe.refunds.create({
				payment_intent: params.paymentId,
				reason: "requested_by_customer",
				metadata: { conversationId: params.conversationId },
			});

			return {
				status: refund.status === "succeeded" ? "success" : "failure",
				message:
					refund.status === "succeeded"
						? "Ödeme başarıyla iade edildi."
						: `İade başarısız: ${refund.failure_reason ?? "Bilinmeyen hata"}`,
				providerResult: refund,
			};
		} catch (error) {
			console.error("[Stripe] cancelPayment error:", error);
			return {
				status: "failure",
				message: error instanceof Error ? error.message : "Stripe iade hatası",
			};
		}
	}

	async handleFullRefund(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult> {
		// Stripe refund is idempotent — full refund by default
		return this.cancelPayment(params);
	}
}
