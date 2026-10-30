CREATE TABLE `gestures` (
	`memorial_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`memorial_id`, `user_id`, `kind`),
	FOREIGN KEY (`memorial_id`) REFERENCES `memorials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `memorials` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nickname` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`coat` text NOT NULL,
	`breed` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presence` (
	`user_id` text PRIMARY KEY NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`pet` text NOT NULL,
	`updated_at` integer NOT NULL
);
