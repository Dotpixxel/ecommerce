export interface SendEmailParams {
	from: string;
	to: string;
	subject: string;
	html: string;
}

export interface EmailResult {
	success: boolean;
	error?: unknown;
}

export interface IEmailProvider {
	send(params: SendEmailParams): Promise<EmailResult>;
}
