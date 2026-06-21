CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`delta` real NOT NULL,
	`resulting_quantity` real NOT NULL,
	`reason` text DEFAULT 'adjust' NOT NULL,
	`notes` text,
	`server_id` text,
	`sync_status` text DEFAULT 'pending_create' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
