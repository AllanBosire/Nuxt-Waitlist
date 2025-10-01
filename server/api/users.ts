import { z } from "zod/v4-mini";
import { Waitlist } from "../utils/drizzle";

const schema = z.object({
	limit: z.optional(z.union([z.string(), z.number()]).check(z.refine((v) => toNumber(v)))),
	page: z.optional(z.union([z.string(), z.number()]).check(z.refine((v) => toNumber(v)))),
	orderBy: z.optional(z.string()),
});

export default defineEventHandler(async (event) => {
	const db = useDrizzle();
	const { limit = 10, page = 1, orderBy } = await getValidatedQuery(event, schema.parse);
	const offset = (toNumber(page) - 1) * toNumber(limit);

	const query = db.select().from(tables.waitlist);

	if (orderBy) {
		query.orderBy(tables.waitlist[orderBy as keyof Waitlist]);
	}

	const users = await query.limit(toNumber(limit)).offset(offset);

	return users;
});
