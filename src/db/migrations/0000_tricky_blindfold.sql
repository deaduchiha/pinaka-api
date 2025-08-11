CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`mobile` text NOT NULL,
	`password` text,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_mobile_unique` ON `users` (`mobile`);