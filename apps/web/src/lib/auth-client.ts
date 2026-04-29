import {
	adminClient,
	anonymousClient,
	emailOTPClient,
	phoneNumberClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [
		anonymousClient(),
		adminClient(),
		phoneNumberClient(),
		emailOTPClient(),
	],
});
