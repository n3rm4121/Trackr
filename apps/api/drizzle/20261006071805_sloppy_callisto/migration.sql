CREATE TABLE "column_labels" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "column_labels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"status" varchar(32) NOT NULL,
	"label" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "jobDescription" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cvFileName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cvMime" varchar(127) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cvSize" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cvData" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "column_labels_user_idx" ON "column_labels" ("userId");--> statement-breakpoint
CREATE INDEX "column_labels_user_status_idx" ON "column_labels" ("userId","status");--> statement-breakpoint
ALTER TABLE "column_labels" ADD CONSTRAINT "column_labels_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_status_check", ADD CONSTRAINT "applications_status_check" CHECK ("status" in ('applied', 'screening', 'interview', 'offer', 'rejected'));