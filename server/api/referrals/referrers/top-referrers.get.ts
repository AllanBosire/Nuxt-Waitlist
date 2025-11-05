import { count, isNotNull, desc } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const query = getQuery(event);
  const page = Number(query.page || 1);
  const pageSize = Number(query.items || 10);
  const totalCount = count(waitlist.email);
  const referrersDb = await db
    .select({
      referrer: waitlist.referrer,
      referrals: totalCount,
    })
    .from(waitlist)
    .where(isNotNull(waitlist.referrer))
    .groupBy(waitlist.referrer)
    .orderBy(desc(totalCount))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const usernames = new Map();
  const referrers = await Promise.all(
    referrersDb.map(async (referrer) => {
      let mmUser: MMUser | undefined;
      let username: string;
      if (!usernames.has(referrer.referrer)) {
        mmUser = await getMatterMostUserById(referrer.referrer!);
        usernames.set(referrer.referrer, mmUser?.username);
        username = mmUser?.username || "";
      } else {
        usernames.get(referrer.referrer);
        username = mmUser?.username || "";
      }
      return {
        ...referrer,
        referrer: username,
      };
    })
  );

  return referrers;
});
