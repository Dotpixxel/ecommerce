import { getAuth } from "@raunk-butik/auth";
import { createDb } from "@raunk-butik/db";

export async function createContext({ req }: { req?: Request }) {
	const db = createDb();
	const auth = getAuth(db);

	const session = req
		? await auth.api.getSession({
				headers: req.headers,
			})
		: null;

	const clientIp =
		req?.headers.get("x-forwarded-for")?.split(",")[0] ||
		req?.headers.get("x-real-ip") ||
		"127.0.0.1";

	return {
		session,
		db,
		clientIp,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
