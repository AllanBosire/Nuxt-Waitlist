import {
	pgTable,
	text,
	uniqueIndex,
	serial,
	timestamp,
	varchar,
	jsonb,
	boolean,
} from "drizzle-orm/pg-core";
import { RuntimeConfig } from "nuxt/schema";
type PaddedNumber =
	| "01"
	| "02"
	| "03"
	| "04"
	| "05"
	| "06"
	| "07"
	| "08"
	| "09"
	| "10"
	| `${number}`;

type SBM = {
	[Key in keyof RuntimeConfig["mattermost"]["bots"]]: {
		[version: PaddedNumber]: boolean;
	};
};

export const waitlist = pgTable(
	"waitlist",
	{
		id: serial("id"),
		email: text("email").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow(),
		referrer: varchar("referrer", { length: 255 }),
		invite_code: varchar("invite_code", { length: 64 }),
		pswd: text("pswd"),
		sent_bot_messages: jsonb("sent_bot_messages").$type<SBM>(),
	},
	(table) => ({
		emailIdx: uniqueIndex("email_idx").on(table.email),
		inviteCodeIdx: uniqueIndex("invite_code_idx").on(table.invite_code),
	})
);

export const invites = pgTable(
	"invites",
	{
		id: serial("id"),
		code: varchar("code", { length: 64 }).notNull().unique(),
		created_by: varchar("created_by", { length: 255 }).notNull(),
		for_email: varchar("for_email", { length: 255 }).unique(),
		used_by: varchar("used_by", { length: 255 }),
		created_at: timestamp("created_at").defaultNow(),
		used_at: timestamp("used_at"),
		is_active: boolean("is_active").default(true),
	},
	(table) => ({
		codeIdx: uniqueIndex("code_idx").on(table.code),
	})
);

export const broadcastMessages = pgTable("messages", {
	id: serial("id"),
	sender: varchar("sender", { length: 255 }),
	recipients: jsonb("recipients").$type<Array<string>>(),
	timestamp: timestamp("timestamp").defaultNow().notNull(),
	bot: varchar("bot", { length: 255 }),
	content: text("content"),
});

export const analytics = pgTable(
	"analytics",
	{
		id: serial("id"),
		session_id: varchar("session_id", { length: 64 }).unique(),
		data: jsonb("data").$type<Analytics>(),
		ip: varchar("ip", { length: 64 }),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		sessionIdIdx: uniqueIndex("session_id_idx").on(table.session_id),
	})
);

export const surveys = pgTable("surveys", {
	id: serial("id"),
	user_id: varchar("session_id", { length: 255 }).unique(),
	data: jsonb("data").$type<Survey["survey"]>(),
	created_at: timestamp("created_at").defaultNow(),
	version: varchar("version", { length: 64 }),
	host: varchar("host", { length: 64 }),
});
