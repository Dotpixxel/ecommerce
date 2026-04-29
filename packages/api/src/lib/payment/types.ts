// ─── Payment Provider Types ───────────────────────────────────────────────────

export interface PaymentCheckoutParams {
	orderId: string;
	/** e.g. "${orderId}|${shippingCompany}" — provider stores this and returns on callback */
	basketId: string;
	items: Array<{
		id: string;
		name: string;
		category1: string;
		itemType: string;
		/** Pre-formatted string: (unitPrice * quantity).toFixed(2) */
		price: string;
	}>;
	/** Sum of all item prices (before discount) */
	totalAmount: number;
	/** Amount customer actually pays (after discount, min 0.1) */
	paidAmount: number;
	shippingFee: number;
	currency: string;
	/** URL provider will POST/redirect to after payment */
	callbackUrl: string;
	buyer: {
		id: string;
		name: string;
		surname: string;
		email: string;
		gsmNumber: string;
		identityNumber: string;
		lastLoginDate: string;
		registrationDate: string;
		registrationAddress: string;
		ip: string;
		city: string;
		country: string;
		zipCode: string;
	};
	shippingAddress: {
		contactName: string;
		city: string;
		country: string;
		address: string;
		zipCode: string;
	};
	billingAddress: {
		contactName: string;
		city: string;
		country: string;
		address: string;
		zipCode: string;
	};
	enabledInstallments?: number[];
}

export interface PaymentCheckoutResult {
	status: "success" | "failure";
	/** The hosted payment page URL to redirect the user to */
	paymentUrl?: string;
	errorMessage?: string;
	/** Raw provider response — kept for backward compatibility */
	raw?: Record<string, unknown>;
}

export interface PaymentVerifyResult {
	status: "success" | "failure";
	/** Provider's internal payment/transaction ID — stored on the order */
	paymentId?: string;
	/** The basketId sent at checkout init — used to recover orderId */
	basketId?: string;
	errorMessage?: string;
	/** Raw provider response */
	raw?: Record<string, unknown>;
}

export interface PaymentRefundResult {
	status: string;
	message: string;
	providerResult?: unknown;
}

// ─── IPaymentProvider Interface ───────────────────────────────────────────────

export interface IPaymentProvider {
	/** Initialise a hosted payment page and return its URL */
	createCheckoutSession(
		params: PaymentCheckoutParams,
	): Promise<PaymentCheckoutResult>;

	/** Verify a completed payment using the provider's token/session ID */
	verifyPayment(token: string): Promise<PaymentVerifyResult>;

	/** Void/cancel a payment (same-day, before settlement) */
	cancelPayment(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult>;

	/** Full refund — tries cancel first, falls back to itemized refund */
	handleFullRefund(params: {
		paymentId: string;
		conversationId: string;
	}): Promise<PaymentRefundResult>;
}
