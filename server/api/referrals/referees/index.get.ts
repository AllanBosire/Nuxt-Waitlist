import { isNotNull } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";
import { paginationSchema } from "../../../utils/schemas";
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
    .limit(items)
    .offset((page - 1) * items);

  type Referee = (typeof refereesResult)[number];
  const referees = new Map<string, Referee[]>();
  refereesResult.forEach((referee) => {
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
        username: string;
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
        username: r.email.split("@")[0],
      });
    });
  });

  return arr;
});
