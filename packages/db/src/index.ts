import { createClient } from "@libsql/client";
import { env } from "@raunk-butik/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb() {
	const client = createClient({
		url: env.DATABASE_URL,
		authToken: env.DATABASE_AUTH_TOKEN ?? "",
	});

	return drizzle({ client, schema });
}
