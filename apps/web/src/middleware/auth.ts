import { getAuth } from "@raunk-butik/auth";
import { createDb } from "@raunk-butik/db";
import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const db = createDb();
		const auth = getAuth(db);
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		return next({
			context: { session },
		});
	},
);
