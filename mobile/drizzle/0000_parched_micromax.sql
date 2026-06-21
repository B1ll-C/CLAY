CREATE TABLE `tbllist_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lt_id` integer,
	`item` text NOT NULL,
	`isChecked` integer DEFAULT false,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`lt_id`) REFERENCES `tbllist_title`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tbllist_title` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_title` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deletedAt` integer
);
