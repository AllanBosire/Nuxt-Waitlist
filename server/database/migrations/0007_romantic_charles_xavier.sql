ALTER TABLE "invites" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_unique" UNIQUE("used_by");