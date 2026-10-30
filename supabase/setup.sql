-- Run once in a NEW Supabase project SQL Editor. No local preview data is imported.
BEGIN;
CREATE SCHEMA IF NOT EXISTS "garden";

CREATE TABLE "garden"."comments" (
	"id" text PRIMARY KEY NOT NULL,
	"memorial_id" text NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE TABLE "garden"."gestures" (
	"memorial_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "gestures_memorial_id_user_id_kind_pk" PRIMARY KEY("memorial_id","user_id","kind")
);

CREATE TABLE "garden"."memorials" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL,
	"photo" text
);

CREATE TABLE "garden"."messages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE TABLE "garden"."pets" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"coat" text NOT NULL,
	"breed" text NOT NULL
);

CREATE TABLE "garden"."presence" (
	"user_id" text PRIMARY KEY NOT NULL,
	"x" real NOT NULL,
	"z" real NOT NULL,
	"pet" text NOT NULL,
	"updated_at" bigint NOT NULL
);

ALTER TABLE "garden"."comments" ADD CONSTRAINT "comments_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "garden"."memorials"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "garden"."gestures" ADD CONSTRAINT "gestures_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "garden"."memorials"("id") ON DELETE cascade ON UPDATE no action;
REVOKE ALL ON SCHEMA garden FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA garden FROM PUBLIC, anon, authenticated;
ALTER TABLE garden.memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX comments_memorial_created ON garden.comments (memorial_id,created_at);
CREATE INDEX messages_user_created ON garden.messages (user_id,created_at);
CREATE INDEX comments_user_created ON garden.comments (user_id,created_at);
CREATE INDEX presence_updated ON garden.presence (updated_at);
COMMIT;
