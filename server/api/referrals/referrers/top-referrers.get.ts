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

  // const referrers = await Promise.all(
  //   referrersDb.map(async (referrer) => {
  //     let mmUser: MMUser | undefined;

  //     mmUser = await getMatterMostUserById(referrer.referrer!);

  //     return {
  //       ...referrer,
  //       referrer: mmUser?.username || "",
  //     };
  //   })
  // );

  // return referrers;
  type Referee = (typeof referrersDb)[number];
  const referees = new Map<string, Referee[]>();
  referrersDb.forEach((referee) => {
    if (!referee.referrer) {
      return;
    }

    let _referees = referees.get(referee.referrer);
    if (!_referees) {
      _referees = [];
      referees.set(referee.referrer, _referees);
    }

    _referees.push(referee);
  });

  const ids = toArray(referees.keys());
  const referrers = (await getMatterMostUserById(ids)) || [];
  const arr: Array<
    Prettify<
      Omit<Referee, "referrer"> & {
        referrer: string;
      }
    >
  > = [];
  referrers.forEach((referrer) => {
    const _referees = referees.get(referrer.id);
    _referees?.forEach((r) => {
      arr.push({
        ...r,
        referrer: referrer.username,
      });
    });
  });
  return arr;
});
