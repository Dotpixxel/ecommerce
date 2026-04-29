import { env } from "@raunk-butik/env/server";
import { ResendEmailProvider } from "./providers/resend";
import { SmtpEmailProvider } from "./providers/smtp";
import type { IEmailProvider } from "./types";

export type { IEmailProvider, SendEmailParams, EmailResult } from "./types";

let _provider: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
	if (_provider) return _provider;

	const provider = env.EMAIL_PROVIDER ?? "smtp";

	switch (provider) {
		case "smtp":
			_provider = new SmtpEmailProvider();
			break;
		case "resend":
			_provider = new ResendEmailProvider();
			break;
		default:
			throw new Error(`Unknown email provider: "${String(provider)}"`);
	}

	return _provider;
}
