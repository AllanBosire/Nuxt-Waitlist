import { count, isNotNull, desc } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";

export default defineEventHandler(async () => {
  const db = useDrizzle();
  const totalCount = count(waitlist.email);
  const referees = await db
    .select({
      referrer: waitlist.referrer,
      referrals: totalCount,
    })
    .from(waitlist)
    .where(isNotNull(waitlist.referrer))
    .groupBy(waitlist.referrer)
    .orderBy(desc(totalCount));
  return referees;
});
