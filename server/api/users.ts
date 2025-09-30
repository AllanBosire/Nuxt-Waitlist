import { z } from "zod/v4-mini";
import { Waitlist } from "../utils/drizzle";

const schema = z.object({
	limit: z.optional(z.number()),
	page: z.optional(z.number()),
	orderBy: z.optional(z.string()),
});

export default defineEventHandler(async (event) => {
	const db = useDrizzle();
	const { limit = 10, page = 1, orderBy } = await getValidatedQuery(event, schema.parse);
	const offset = (page - 1) * limit;

	const query = db.select().from(tables.waitlist);

	if (orderBy) {
		query.orderBy(tables.waitlist[orderBy as keyof Waitlist]);
	}

	const users = await query.limit(limit).offset(offset);

	return users;
});
