import { env } from "@raunk-butik/env/server";
import { IyzicoProvider } from "./providers/iyzico";
import { StripeProvider } from "./providers/stripe";
import type { IPaymentProvider } from "./types";

export type {
	IPaymentProvider,
	PaymentCheckoutParams,
	PaymentCheckoutResult,
	PaymentVerifyResult,
	PaymentRefundResult,
} from "./types";

let _provider: IPaymentProvider | null = null;

export function getPaymentProvider(): IPaymentProvider {
	if (_provider) return _provider;

	const provider = env.PAYMENT_PROVIDER ?? "iyzico";

	switch (provider) {
		case "iyzico":
			_provider = new IyzicoProvider();
			break;
		case "stripe":
			_provider = new StripeProvider();
			break;
		default:
			throw new Error(`Unknown payment provider: "${String(provider)}"`);
	}

	return _provider;
}
