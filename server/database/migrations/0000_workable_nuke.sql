CREATE TABLE IF NOT EXISTS "tokens" (
	"id" serial NOT NULL,
	"value" text NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" serial NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"referrer" varchar(255),
	"pswd" text,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_email_waitlist_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."waitlist"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "waitlist" USING btree ("email");