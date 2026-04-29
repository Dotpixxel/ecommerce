import { integer, text } from "drizzle-orm/sqlite-core";
import { createdAt, createTable, id, updatedAt } from "./helpers";

export const campaigns = createTable("campaign", {
	id,
	title: text("title").notNull(),
	description: text("description"),
	imageUrl: text("image_url"),
	linkUrl: text("link_url"),
	startDate: integer("start_date", { mode: "timestamp" }),
	endDate: integer("end_date", { mode: "timestamp" }),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	priority: integer("priority").notNull().default(0),
	showTitle: integer("show_title", { mode: "boolean" }).notNull().default(true),
	showDescription: integer("show_description", { mode: "boolean" })
		.notNull()
		.default(true),
	showButton: integer("show_button", { mode: "boolean" })
		.notNull()
		.default(true),
	showBanner: integer("show_banner", { mode: "boolean" })
		.notNull()
		.default(true),
	createdAt,
	updatedAt,
});
