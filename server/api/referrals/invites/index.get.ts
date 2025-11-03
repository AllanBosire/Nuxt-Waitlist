import { isNotNull, isNull } from "drizzle-orm";
import { invites } from "~~/server/database/schema";

export default defineEventHandler(async () => {
  const db = useDrizzle();

  const unclaimedInvites = await db
    .select({
      email: invites.for_email,
      invite_sendout_time: invites.created_at,
      referrer: invites.created_by,
    })
    .from(invites)
    .where(and(eq(invites.is_active, true), isNotNull(invites.used_by)));

  return unclaimedInvites;
});
