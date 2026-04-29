import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		DATABASE_AUTH_TOKEN: z.string().optional(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		// ── Payment ──────────────────────────────────────────────────────────
		PAYMENT_PROVIDER: z.enum(["iyzico", "stripe"]).default("iyzico"),

		// Iyzico
		IYZICO_API_KEY: z.string().optional(),
		IYZICO_SECRET_KEY: z.string().optional(),
		IYZICO_BASE_URL: z.string().url().optional(),

		// Stripe
		STRIPE_SECRET_KEY: z.string().optional(),
		STRIPE_WEBHOOK_SECRET: z.string().optional(),

		// ── Auth / Social ─────────────────────────────────────────────────────
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),

		// ── Email ─────────────────────────────────────────────────────────────
		EMAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
		EMAIL_FROM: z.string().optional(),

		// SMTP
		SMTP_HOST: z.string().optional(),
		SMTP_PORT: z.coerce.number().optional(),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),

		// Resend (ileride kullanmak için yer tutucu)
		RESEND_API_KEY: z.string().optional(),

		// ── Storage (S3-compatible: Cloudflare R2 veya MinIO; STORAGE_PROVIDER=local ise gerekmez) ─
		STORAGE_PROVIDER: z.enum(["s3", "local"]).default("s3"),
		R2_ENDPOINT: z.string().url().optional(),
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_BUCKET_NAME: z.string().optional(),
		R2_PUBLIC_DOMAIN: z.string().url().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
