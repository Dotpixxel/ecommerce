/**
 * Backward compatibility re-export.
 * All payment logic has moved to ./payment/providers/iyzico.ts
 * Use getPaymentProvider() from ./payment/index.ts for new code.
 */
export {
	Iyzipay,
	iyzipay,
	createRefundRequest,
	createCancelRequest,
	type RefundResult,
} from "./payment/providers/iyzico";

export { getPaymentProvider } from "./payment/index";
export type { IPaymentProvider } from "./payment/types";

/**
 * @deprecated Use getPaymentProvider().handleFullRefund() instead.
 */
export async function handleFullOrderRefund(params: {
	paymentId: string;
	conversationId: string;
}): Promise<{ status: string; message: string; iyzicoResult?: unknown }> {
	const { getPaymentProvider } = await import("./payment/index");
	const result = await getPaymentProvider().handleFullRefund(params);
	return {
		status: result.status,
		message: result.message,
		iyzicoResult: result.providerResult,
	};
}
