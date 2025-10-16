CREATE TABLE IF NOT EXISTS "surveys" (
	"id" serial NOT NULL,
	"session_id" varchar(255),
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"version" varchar(64),
	"host" varchar(64),
	CONSTRAINT "surveys_session_id_unique" UNIQUE("session_id")
);
