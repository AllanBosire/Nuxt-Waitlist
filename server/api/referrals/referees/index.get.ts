import { isNotNull } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";
import { MMUser } from "~~/server/utils/mattermost";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const query = getQuery(event);
  const page = Number(query.page || 1);
  const pageSize = Number(query.items || 10);

  const refereesDb = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      createdAt: waitlist.createdAt,
      referrer: waitlist.referrer,
    })
    .from(waitlist)
    .where(isNotNull(waitlist.referrer))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const referrerUsernames = new Map();

  const referees = await Promise.all(
    refereesDb.map(async (referee) => {
      let mmUser: MMUser | undefined;
      let referrerUsername: string;
      if (!referrerUsernames.has(referee.referrer)) {
        mmUser = await getMatterMostUserById(referee.referrer!);
        referrerUsername = mmUser?.username || "";
        referrerUsernames.set(referee.referrer, referrerUsername);
      } else {
        referrerUsername = referrerUsernames.get(referee.referrer);
      }
      const mmRefereeUser = await getMatterMostUserByEmail(referee.email);

      return {
        ...referee,
        referrer: referrerUsername,
        username: mmRefereeUser?.username,
      };
    })
  );

  return referees;
});
