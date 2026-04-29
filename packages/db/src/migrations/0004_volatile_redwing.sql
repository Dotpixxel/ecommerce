DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "cart_item_userId_idx";--> statement-breakpoint
DROP INDEX "category_slug_unique";--> statement-breakpoint
DROP INDEX "product_slug_unique";--> statement-breakpoint
DROP INDEX "product_slug_idx";--> statement-breakpoint
DROP INDEX "product_category_idx";--> statement-breakpoint
DROP INDEX "review_productId_idx";--> statement-breakpoint
ALTER TABLE `account` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `cart_item_userId_idx` ON `cart_item` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_unique` ON `category` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_slug_idx` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `product` (`category_id`);--> statement-breakpoint
CREATE INDEX `review_productId_idx` ON `review` (`product_id`);--> statement-breakpoint
ALTER TABLE `session` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));