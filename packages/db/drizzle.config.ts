import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
	path:
		process.env.APP_ENV === "production"
			? "../../.env.production"
			: process.env.APP_ENV === "staging"
				? "../../.env.staging"
				: "../../apps/web/.env",
});

const url = process.env.DATABASE_URL || "";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// file: URL → SQLite dialect (no authToken needed)
// libsql:// or http:// → Turso dialect (authToken required)
const isLocalFile = url.startsWith("file:");

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	...(isLocalFile
		? {
				dialect: "sqlite",
				dbCredentials: { url },
			}
		: {
				dialect: "turso",
				dbCredentials: { url, authToken },
			}),
});
