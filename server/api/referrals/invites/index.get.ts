import { isNotNull, isNull } from "drizzle-orm";
import { invites } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const query = getQuery(event);

  const page = Number(query.page || 1);
  const pageSize = Number(query.items || 1);

  const unclaimedInvites = await db
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
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return unclaimedInvites;
});
