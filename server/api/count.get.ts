import { useDrizzle } from "~~/server/utils/drizzle";
import { count, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const entry = await useDrizzle().select({ count: count() }).from(tables.waitlist);

	if (entry.length === 1) {
		return entry[0];
	}
	return null;
});
