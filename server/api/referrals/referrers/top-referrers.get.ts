import { count, isNotNull, desc, ConsoleLogWriter } from "drizzle-orm";
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
  let regex = "";
  const excludedDomainLength = ExcludedDomains.length;
  ExcludedDomains.forEach((domain, index) => {
    if (index < excludedDomainLength - 1) {
      regex += `${domain}|`;
      return;
    }
    regex += `${domain}`;
  });

  referrers.forEach((referrer) => {
    if (referrer.email.match(regex)) {
      return;
    }
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
