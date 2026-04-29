CREATE TABLE `campaign` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_url` text,
	`link_url` text,
	`start_date` integer,
	`end_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupon` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_type` text NOT NULL,
	`discount_amount` real NOT NULL,
	`min_order_amount` real DEFAULT 0 NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_code_unique` ON `coupon` (`code`);--> statement-breakpoint
ALTER TABLE `order` ADD `coupon_id` text REFERENCES coupon(id);--> statement-breakpoint
ALTER TABLE `order` ADD `discount_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `category` ADD `parent_id` text REFERENCES category(id);--> statement-breakpoint
ALTER TABLE `category` ADD `order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `category` ADD `isActive` integer DEFAULT true NOT NULL;