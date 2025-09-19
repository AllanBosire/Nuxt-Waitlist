import {
	pgTable,
	text,
	uniqueIndex,
	serial,
	timestamp,
	boolean,
	varchar,
} from "drizzle-orm/pg-core";

export const waitlist = pgTable(
	"waitlist",
	{
		id: serial("id"),
		email: text("email").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow(),
		referrer: varchar("referrer", { length: 255 }),
		pswd: text("pswd"),
	},
	(table) => ({
		emailIdx: uniqueIndex("email_idx").on(table.email),
	})
);

export const token = pgTable("tokens", {
	id: serial("id"),
	value: text("value").notNull(),
	email: varchar("user_email", { length: 255 })
		.references(() => waitlist.email)
		.notNull(),
	expired: boolean("expired").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow(),
});
