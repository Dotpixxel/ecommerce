import { relations } from "drizzle-orm";
import {
	type AnySQLiteColumn,
	index,
	integer,
	real,
	text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { createdAt, createTable, id, updatedAt } from "./helpers";

export const products = createTable(
	"product",
	{
		id,
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description").notNull(),
		price: real("price").notNull(),
		stock: integer("stock").notNull().default(0),
		images: text("images", { mode: "json" }).$type<string[]>().notNull(),
		brand: text("brand"),
		categoryId: text("category_id"),
		sizes: text("sizes", { mode: "json" }).$type<string[]>(),
		colors: text("colors", { mode: "json" }).$type<string[]>(),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		deletedAt: integer("deleted_at", { mode: "timestamp" }),
		createdAt,
		updatedAt,
	},
	(table) => [
		index("product_slug_idx").on(table.slug),
		index("product_category_idx").on(table.categoryId),
	],
);

export const productVariants = createTable(
	"product_variant",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		size: text("size"),
		color: text("color"),
		stock: integer("stock").notNull().default(0),
		createdAt,
		updatedAt,
	},
	(table) => [index("product_variant_productId_idx").on(table.productId)],
);

export const categories = createTable("category", {
	id,
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, {
		onDelete: "cascade",
	}),
	order: integer("order").notNull().default(0),
	isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
	imageUrl: text("image_url"),
});

export const reviews = createTable(
	"review",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		rating: integer("rating").notNull(),
		comment: text("comment"),
		status: text("status", {
			enum: ["pending", "approved", "rejected"],
		})
			.notNull()
			.default("pending"),
		createdAt,
	},
	(table) => [index("review_productId_idx").on(table.productId)],
);

export const cartItems = createTable(
	"cart_item",
	{
		id,
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		productId: text("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull().default(1),
		size: text("size"),
		color: text("color"),
		createdAt,
	},
	(table) => [index("cart_item_userId_idx").on(table.userId)],
);

export const backInStockRequests = createTable(
	"back_in_stock_request",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		size: text("size"),
		color: text("color"),
		status: text("status", { enum: ["pending", "notified"] })
			.notNull()
			.default("pending"),
		createdAt,
	},
	(table) => [
		index("backInStock_product_idx").on(table.productId),
		index("backInStock_email_idx").on(table.email),
	],
);

export const productsRelations = relations(products, ({ many, one }) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id],
	}),
	reviews: many(reviews),
	cartItems: many(cartItems),
	backInStockRequests: many(backInStockRequests),
	variants: many(productVariants),
}));

export const productVariantsRelations = relations(
	productVariants,
	({ one }) => ({
		product: one(products, {
			fields: [productVariants.productId],
			references: [products.id],
		}),
	}),
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id],
	}),
	user: one(user, {
		fields: [cartItems.userId],
		references: [user.id],
	}),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
	products: many(products),
	parent: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "category_parent",
	}),
	children: many(categories, {
		relationName: "category_parent",
	}),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id],
	}),
	user: one(user, {
		fields: [reviews.userId],
		references: [user.id],
	}),
}));

export const backInStockRequestsRelations = relations(
	backInStockRequests,
	({ one }) => ({
		product: one(products, {
			fields: [backInStockRequests.productId],
			references: [products.id],
		}),
	}),
);
