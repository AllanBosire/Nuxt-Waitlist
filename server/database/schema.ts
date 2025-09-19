import { pgTable, text, uniqueIndex, serial, timestamp } from "drizzle-orm/pg-core";

export const waitlist = pgTable(
	"waitlist",
	{
		id: serial("id"),
		email: text("email").notNull().unique(),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => ({
		emailIdx: uniqueIndex("email_idx").on(table.email),
	})
);
