import { relations } from "drizzle-orm";
import { integer, real, text } from "drizzle-orm/sqlite-core";
import { createdAt, createTable, id, updatedAt } from "./helpers";
import { orders } from "./order";

export const coupons = createTable("coupon", {
	id,
	code: text("code").notNull().unique(),
	discountType: text("discount_type", {
		enum: ["percentage", "fixed"],
	}).notNull(),
	discountAmount: real("discount_amount").notNull(),
	minOrderAmount: real("min_order_amount").notNull().default(0),
	startDate: integer("start_date", { mode: "timestamp" }),
	endDate: integer("end_date", { mode: "timestamp" }),
	usageLimit: integer("usage_limit"),
	usedCount: integer("used_count").notNull().default(0),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt,
	updatedAt,
});

export const couponsRelations = relations(coupons, ({ many }) => ({
	orders: many(orders),
}));
