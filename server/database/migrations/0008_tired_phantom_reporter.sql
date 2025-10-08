ALTER TABLE "invites" DROP CONSTRAINT "invites_used_by_unique";--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "for_email" varchar(255);--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_for_email_unique" UNIQUE("for_email");