import { isNotNull, isNull } from "drizzle-orm";
import { invites } from "~~/server/database/schema";
import { paginationSchema } from "../../../utils/schemas";
export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const { page, items } = await getValidatedQuery(
    event,
    paginationSchema.parse
  );

  const unclaimedInvitesDb = await db
    .select({
      email: invites.for_email,
      invite_sendout_time: invites.created_at,
      referrer: invites.created_by,
    })
    .from(invites)
    .where(
      and(
        and(eq(invites.is_active, true), isNull(invites.used_by)),
        isNotNull(invites.for_email)
      )
    )
    .limit(items)
    .offset((page - 1) * items);
  type UnclaimedInvite = (typeof unclaimedInvitesDb)[number];
  const referees = new Map<string, UnclaimedInvite[]>();
  unclaimedInvitesDb.forEach((referee) => {
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
      Omit<UnclaimedInvite, "referrer"> & {
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
