CREATE SCHEMA IF NOT EXISTS "garden";
--> statement-breakpoint
CREATE TABLE "garden"."comments" (
	"id" text PRIMARY KEY NOT NULL,
	"memorial_id" text NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garden"."gestures" (
	"memorial_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "gestures_memorial_id_user_id_kind_pk" PRIMARY KEY("memorial_id","user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "garden"."memorials" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL,
	"photo" text
);
--> statement-breakpoint
CREATE TABLE "garden"."messages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garden"."pets" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"coat" text NOT NULL,
	"breed" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garden"."presence" (
	"user_id" text PRIMARY KEY NOT NULL,
	"x" real NOT NULL,
	"z" real NOT NULL,
	"pet" text NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "garden"."comments" ADD CONSTRAINT "comments_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "garden"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garden"."gestures" ADD CONSTRAINT "gestures_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "garden"."memorials"("id") ON DELETE cascade ON UPDATE no action;