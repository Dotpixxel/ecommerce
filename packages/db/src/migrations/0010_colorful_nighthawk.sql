CREATE TABLE `back_in_stock_request` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`email` text NOT NULL,
	`size` text,
	`color` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `backInStock_product_idx` ON `back_in_stock_request` (`product_id`);--> statement-breakpoint
CREATE INDEX `backInStock_email_idx` ON `back_in_stock_request` (`email`);