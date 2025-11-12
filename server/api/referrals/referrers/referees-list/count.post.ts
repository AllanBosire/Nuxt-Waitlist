import { count } from "drizzle-orm/sql/functions";

import { waitlist } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const body = await readBody(event);
  const referrer = body.referrer as string;
  return await db
    .select({ count: count() })
    .from(waitlist)
    .where(eq(waitlist.referrer, referrer));
});
