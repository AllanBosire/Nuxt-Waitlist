import { pgTable, text, uniqueIndex, serial, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
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
		pswd: text("pswd"),
		sent_bot_messages: jsonb("sent_bot_messages").$type<SBM>(),
	},
	(table) => ({
		emailIdx: uniqueIndex("email_idx").on(table.email),
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

interface Analytics {
	deviceType: string;
	browser: {
		name: any;
		version: any;
	};
	os: string;
	referrer: string;
	timestamp: string;
	screen: {
		width: number;
		height: number;
	};
	language: string;
	utm: Record<string, string | null>;
	timezone: string;
	sessionId: string;
	scrollDepth: number;
	interactions: {
		type: string;
		target: any;
		time: number;
	}[];
	performance: {
		deviceMemory: any;
		hardwareConcurrency: number;
	};
	network: {
		downlink: any;
		effectiveType: any;
		rtt: any;
	};
	adBlock: boolean;
	accessibility: {
		prefersReducedMotion: boolean;
		prefersColorScheme: string;
	};
	multiTab: boolean;
	incognito: unknown;
}

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
