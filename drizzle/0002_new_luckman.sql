PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tbllist_title` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_title` text NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_tbllist_title`("id", "list_title", "createdAt", "updatedAt", "deletedAt") SELECT "id", "list_title", "createdAt", "updatedAt", "deletedAt" FROM `tbllist_title`;--> statement-breakpoint
DROP TABLE `tbllist_title`;--> statement-breakpoint
ALTER TABLE `__new_tbllist_title` RENAME TO `tbllist_title`;--> statement-breakpoint
PRAGMA foreign_keys=ON;