import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { createdAt, createTable, id, updatedAt } from "./helpers";

export const addresses = createTable("address", {
	id,
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	name: text("name").notNull(),
	surname: text("surname").notNull(),
	phone: text("phone").notNull(),
	city: text("city").notNull(),
	district: text("district").notNull(),
	neighborhood: text("neighborhood").notNull(),
	addressDetail: text("address_detail").notNull(),
	zipCode: text("zip_code").notNull(),
	createdAt,
	updatedAt,
});

export const addressesRelations = relations(addresses, ({ one }) => ({
	user: one(user, {
		fields: [addresses.userId],
		references: [user.id],
	}),
}));
