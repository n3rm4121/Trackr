CREATE TABLE "applications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"company" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"jobUrl" text DEFAULT '' NOT NULL,
	"location" varchar(255) DEFAULT '' NOT NULL,
	"salary" varchar(255) DEFAULT '' NOT NULL,
	"status" varchar(32) DEFAULT 'applied' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"appliedAt" timestamp with time zone NOT NULL,
	"lastActivityAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_status_check" CHECK ("status" in ('applied', 'interview', 'offer', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"applicationId" integer NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "applications_user_status_position_idx" ON "applications" ("userId","status","position");--> statement-breakpoint
CREATE INDEX "applications_user_id_idx" ON "applications" ("userId");--> statement-breakpoint
CREATE INDEX "notes_application_created_idx" ON "notes" ("applicationId","createdAt" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_applicationId_applications_id_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE;