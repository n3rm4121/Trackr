DROP TABLE "sessions";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tokenVersion" integer DEFAULT 1 NOT NULL;