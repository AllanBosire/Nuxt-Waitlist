import { isNotNull, isNull } from "drizzle-orm";
import { invites } from "~~/server/database/schema";
import paginationSchema from "../../../utils/schemas";
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

  const unclaimedInvites = Promise.all(
    unclaimedInvitesDb.map(async (unclaimedInvite) => {
      const referrer = await getMatterMostUserById(unclaimedInvite.referrer);

      return {
        ...unclaimedInvite,
        referrer: referrer?.username || "",
      };
    })
  );

  return unclaimedInvites;
});
