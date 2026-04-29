import dotenv from "dotenv";
import { count } from "drizzle-orm";

dotenv.config({ path: "../../apps/web/.env" });

async function main() {
	try {
		const { createDb } = await import("./index");
		const { products } = await import("./schema/product");

		const db = createDb();
		const result = await db.select({ count: count() }).from(products);
		console.log("Product count:", result[0]?.count);
		process.exit(0);
	} catch (error) {
		console.error("Error checking DB:", error);
		process.exit(1);
	}
}

main();
