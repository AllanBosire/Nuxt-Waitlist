CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" serial NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"referrer" varchar(255),
	"pswd" text,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "waitlist" USING btree ("email");