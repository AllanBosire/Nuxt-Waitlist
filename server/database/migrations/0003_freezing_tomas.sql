CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial NOT NULL,
	"sender" varchar(255),
	"recipients" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"bot" varchar(255),
	"content" text
);
