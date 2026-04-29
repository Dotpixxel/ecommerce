import { relations } from "drizzle-orm";
import { integer, real, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { coupons } from "./coupon";
import { createdAt, createTable, id, updatedAt } from "./helpers";
import { products } from "./product";

export const orders = createTable("order", {
	id,
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: text("status", {
		enum: ["pending", "paid", "shipped", "delivered", "cancelled", "failed"],
	})
		.notNull()
		.default("pending"),
	totalAmount: real("total_amount").notNull(),
	currency: text("currency").notNull().default("TRY"),
	trackingNumber: text("tracking_number"),
	shippingAddress: text("shipping_address", { mode: "json" })
		.$type<{
			name: string;
			surname: string;
			email: string;
			gsmNumber: string;
			province: string;
			district: string;
			neighborhood: string;
			addressDetail: string;
			zipCode: string;
			shippingCompany?: "DHL";
		}>()
		.notNull(),
	paymentId: text("payment_id"),
	couponId: text("coupon_id").references(() => coupons.id),
	discountAmount: real("discount_amount").notNull().default(0),
	shippingFee: real("shipping_fee").notNull().default(0),
	createdAt,
	updatedAt,
});

export const orderItems = createTable("order_item", {
	id,
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: text("product_id")
		.notNull()
		.references(() => products.id),
	quantity: integer("quantity").notNull(),
	price: real("price").notNull(),
	size: text("size"),
	color: text("color"),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
	user: one(user, {
		fields: [orders.userId],
		references: [user.id],
	}),
	coupon: one(coupons, {
		fields: [orders.couponId],
		references: [coupons.id],
	}),
	items: many(orderItems),
	returnRequests: many(returnRequests),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));

export const returnRequests = createTable("return_request", {
	id,
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: text("type", { enum: ["cancel", "return"] }).notNull(),
	reason: text("reason").notNull(),
	status: text("status", {
		enum: ["pending", "approved", "rejected"],
	})
		.notNull()
		.default("pending"),
	adminNote: text("admin_note"),
	createdAt,
	updatedAt,
});

export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
	order: one(orders, {
		fields: [returnRequests.orderId],
		references: [orders.id],
	}),
	user: one(user, {
		fields: [returnRequests.userId],
		references: [user.id],
	}),
}));
