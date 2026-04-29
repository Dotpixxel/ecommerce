import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { createdAt, createTable, id } from "./helpers";
import { products } from "./product";

export const wishlist = createTable("wishlist", {
	id,
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	productId: text("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	createdAt,
});

export const wishlistRelations = relations(wishlist, ({ one }) => ({
	user: one(user, {
		fields: [wishlist.userId],
		references: [user.id],
	}),
	product: one(products, {
		fields: [wishlist.productId],
		references: [products.id],
	}),
}));
