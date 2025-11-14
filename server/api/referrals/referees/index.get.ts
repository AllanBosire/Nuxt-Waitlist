import { asc, count, desc, inArray, isNotNull } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";
import { paginationSchema } from "../../../utils/schemas";
import db from "~~/server/database";
export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const { page, items } = await getValidatedQuery(
    event,
    paginationSchema.parse
  );

  const refereesResult = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      createdAt: waitlist.createdAt,
      referrer: waitlist.referrer,
    })
    .from(waitlist)
    .where(isNotNull(waitlist.referrer))
    .orderBy(waitlist.id)
    .limit(items)
    .offset((page - 1) * items);

  type Referee = (typeof refereesResult)[number] & { ownMMId: string };
  const referees = new Map<string, Referee[]>();

  const promiseArr: Promise<unknown>[] = [];
  const refereesMMIds: string[] = [];
  refereesResult.forEach((referee) => {
    if (!referee.referrer) {
      return;
    }

    let _referees = referees.get(referee.referrer);
    if (!_referees) {
      _referees = [];
      referees.set(referee.referrer, _referees);
    }

    promiseArr.push(
      new Promise(async (resolve, reject) => {
        const refereeMM = await getMatterMostUserByEmail(referee.email);
        if (refereeMM) {
          _referees.push({ ...referee, ownMMId: refereeMM.id });
          refereesMMIds.push(refereeMM.id);
          resolve("");
        }
        resolve("");
      })
    );
  });
  await Promise.all(promiseArr);
  const ids = toArray(referees.keys());
  const referrers = (await getMatterMostUserById(ids)) || [];

  const arr: Array<
    Prettify<
      Omit<Referee, "referrer"> & {
        username: string;
        referrer: string;
        referrals: number | undefined;
      }
    >
  > = [];

  const referralsCount = await getReferralsCount(refereesMMIds);

  const referralsCountMap = new Map<string, number>();
  referralsCount.forEach((referral) => {
    if (referral.referrer) {
      referralsCountMap.set(referral.referrer, referral.count);
    }
  });

  referrers.forEach((referrer) => {
    const _referees = referees.get(referrer.id);
    _referees?.forEach((r) => {
      const referrals = referralsCountMap.get(r.ownMMId);

      arr.push({
        ...r,
        referrer: referrer.username,
        username: r.email.split("@")[0],
        referrals: referrals ? referrals : 0,
      });
    });
  });

  return arr;
});

async function getReferralsCount(userMMIds: string[]) {
  return await db
    .select({ referrer: waitlist.referrer, count: count(waitlist.email) })
    .from(waitlist)
    .where(inArray(waitlist.referrer, userMMIds))
    .groupBy(waitlist.referrer);
}
