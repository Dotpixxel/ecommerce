import { getAuth } from "@raunk-butik/auth";
import { createDb } from "@raunk-butik/db";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const db = createDb();
				const auth = getAuth(db);
				return auth.handler(request);
			},
			POST: ({ request }) => {
				const db = createDb();
				const auth = getAuth(db);
				return auth.handler(request);
			},
		},
	},
});
