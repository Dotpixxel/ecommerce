import type { IEmailProvider, EmailResult, SendEmailParams } from "../types";

/**
 * Resend provider — stub, not currently implemented.
 * Reserved for future use. Install the `resend` package and implement when needed.
 */
export class ResendEmailProvider implements IEmailProvider {
	async send(_params: SendEmailParams): Promise<EmailResult> {
		throw new Error(
			"ResendEmailProvider is not implemented. Use SmtpEmailProvider.",
		);
	}
}
