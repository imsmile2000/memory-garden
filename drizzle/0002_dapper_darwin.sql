CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`user_id` text NOT NULL,
	`nickname` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`memorial_id`) REFERENCES `memorials`(`id`) ON UPDATE no action ON DELETE cascade
);
