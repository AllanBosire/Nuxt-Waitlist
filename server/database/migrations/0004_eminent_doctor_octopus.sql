CREATE TABLE IF NOT EXISTS "analytics" (
	"id" serial NOT NULL,
	"session_id" varchar(64),
	"data" jsonb,
	"ip" varchar(64),
	"created_at" timestamp DEFAULT now()
);
