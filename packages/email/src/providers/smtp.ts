import { env } from "@raunk-butik/env/server";
import nodemailer from "nodemailer";
import type { IEmailProvider, EmailResult, SendEmailParams } from "../types";

export class SmtpEmailProvider implements IEmailProvider {
	private transporter: nodemailer.Transporter;

	constructor() {
		const port = env.SMTP_PORT ?? 587;
		this.transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port,
			secure: port === 465,
			auth:
				env.SMTP_USER && env.SMTP_PASS
					? { user: env.SMTP_USER, pass: env.SMTP_PASS }
					: undefined,
		});
	}

	async send(params: SendEmailParams): Promise<EmailResult> {
		try {
			await this.transporter.sendMail({
				from: params.from,
				to: params.to,
				subject: params.subject,
				html: params.html,
			});
			return { success: true };
		} catch (error) {
			console.error("[SMTP] Failed to send email:", error);
			return { success: false, error };
		}
	}
}
