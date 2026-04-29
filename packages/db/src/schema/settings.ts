import { text } from "drizzle-orm/sqlite-core";
import { createdAt, createTable, updatedAt } from "./helpers";

export const siteSettings = createTable("site_settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	description: text("description"),
	createdAt,
	updatedAt,
});
