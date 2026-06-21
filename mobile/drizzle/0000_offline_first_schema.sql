CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text,
	`barcode` text,
	`sku` text,
	`unit` text,
	`notes` text,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit` text,
	`expiration_date` integer,
	`location` text DEFAULT 'pantry' NOT NULL,
	`min_quantity` real,
	`cost_per_unit` real,
	`notes` text,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`is_shared` integer DEFAULT false NOT NULL,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer NOT NULL,
	`product_id` integer,
	`name` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text,
	`is_checked` integer DEFAULT false NOT NULL,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `store_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`store_id` integer NOT NULL,
	`price` real NOT NULL,
	`unit` text,
	`promotion_price` real,
	`promotion_expires_at` integer,
	`last_verified_at` integer,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`record_id` integer NOT NULL,
	`operation` text NOT NULL,
	`payload` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer
);
