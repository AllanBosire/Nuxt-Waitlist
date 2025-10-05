CREATE TABLE IF NOT EXISTS "invites" (
	"id" serial NOT NULL,
	"code" varchar(64) NOT NULL,
	"created_by" varchar(255),
	"used_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "invite_code" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "code_idx" ON "invites" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invite_code_idx" ON "waitlist" USING btree ("invite_code");