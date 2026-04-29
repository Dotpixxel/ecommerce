import type { createDb } from "@raunk-butik/db";
import * as schema from "@raunk-butik/db/schema/auth";
import { addresses, cartItems, orders } from "@raunk-butik/db/schema/index";
import { getEmailProvider } from "@raunk-butik/email";
import { env } from "@raunk-butik/env/server";
import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, emailOTP } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { ResetPasswordEmail } from "./emails/reset-password";
import { VerificationEmail } from "./emails/verification";

const isDev = env.NODE_ENV === "development";
const isStaging = env.BETTER_AUTH_URL?.includes("staging");
const from = env.EMAIL_FROM || "Raunk Butik <noreply@eken24.de>";

export type DB = ReturnType<typeof createDb>;

export const getAuth = (db: DB) =>
	betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: schema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173",
		],
		plugins: [
			tanstackStartCookies(),
			anonymous({
				onLinkAccount: async ({ newUser, anonymousUser }) => {
					// Re-assign Orders
					await db
						.update(orders)
						.set({ userId: newUser.user.id })
						.where(eq(orders.userId, anonymousUser.user.id));

					// Re-assign Addresses
					await db
						.update(addresses)
						.set({ userId: newUser.user.id })
						.where(eq(addresses.userId, anonymousUser.user.id));

					const anonCartItems = await db
						.select()
						.from(cartItems)
						.where(eq(cartItems.userId, anonymousUser.user.id));

					if (anonCartItems.length === 0) return;

					const permanentCartItems = await db
						.select()
						.from(cartItems)
						.where(eq(cartItems.userId, newUser.user.id));

					for (const anonItem of anonCartItems) {
						const existingItem = permanentCartItems.find(
							(p) =>
								p.productId === anonItem.productId &&
								p.size === anonItem.size &&
								p.color === anonItem.color,
						);

						if (existingItem) {
							await db
								.update(cartItems)
								.set({
									quantity: existingItem.quantity + anonItem.quantity,
								})
								.where(eq(cartItems.id, existingItem.id));

							await db.delete(cartItems).where(eq(cartItems.id, anonItem.id));
						} else {
							await db
								.update(cartItems)
								.set({ userId: newUser.user.id })
								.where(eq(cartItems.id, anonItem.id));
						}
					}
				},
			}),
			admin(),
			phoneNumber(),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) {
					if (isDev) {
						console.log(`[AUTH] OTP (${type}) → ${email} — kod: ${otp}`);
						return;
					}

					if (isStaging) {
						console.log(
							`[AUTH-STAGING] OTP (${type}) → ${email} — kod: ${otp}`,
						);
					}

					const name = "Değerli Müşterimiz";
					let subject = "Doğrulama Kodunuz";
					let emailComponent: React.ReactElement;

					if (type === "sign-in" || type === "email-verification") {
						subject = "Giriş ve Doğrulama Kodunuz";
						emailComponent = VerificationEmail({ name, otp });
					} else {
						subject = "Şifre Sıfırlama Kodunuz";
						emailComponent = ResetPasswordEmail({ name, otp });
					}

					try {
						const html = await render(emailComponent);
						await getEmailProvider().send({
							from,
							to: email,
							subject: `Raunk Butik - ${subject}`,
							html,
						});
					} catch (error) {
						console.error("Failed to send OTP email:", error);
					}
				},
			}),
		],
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID || "",
				clientSecret: env.GOOGLE_CLIENT_SECRET || "",
			},
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: true,
			sendVerificationEmail: async ({ user, url }) => {
				if (isDev) {
					console.log(
						`[AUTH] Verification Email → ${user.email} — link: ${url}`,
					);
					return;
				}

				try {
					const html = await render(VerificationEmail({ name: user.name, url }));
					await getEmailProvider().send({
						from,
						to: user.email,
						subject: "E-posta Adresinizi Doğrulayın",
						html,
					});
				} catch (error) {
					console.error("Failed to send verification email:", error);
				}
			},
		},
		emailAndPassword: {
			enabled: false,
		},
		user: {
			additionalFields: {
				phoneNumber: {
					type: "string",
					required: true,
				},
				role: {
					type: "string",
					defaultValue: "user",
				},
			},
		},
		advanced: {
			// Set to true in production with HTTPS
			useSecureCookies: !isDev,
			defaultCookieAttributes: {
				// Lax is REQUIRED for iyzico callback (cross-site POST redirect) to keep the session
				sameSite: "Lax",
			},
			database: {
				generateId: () => uuidv7(),
			},
		},
	});
