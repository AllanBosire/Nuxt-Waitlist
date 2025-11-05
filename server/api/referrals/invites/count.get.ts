import { count, isNotNull, isNull } from "drizzle-orm";
import { invites } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const unclaimedInvites = await db
    .select({
      count: count(),
    })
    .from(invites)
    .where(
      and(
        and(eq(invites.is_active, true), isNull(invites.used_by)),
        isNotNull(invites.for_email)
      )
    );
  if (unclaimedInvites.length === 1) {
    return unclaimedInvites[0];
  }
  return null;
});
