import { eq } from 'drizzle-orm';
import { waitlist } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const referrerId = getRouterParam(event, 'referrer');

  if (!referrerId) {
    return null;
  }

  const referrer = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      referrer: waitlist.referrer,
      createdAt: waitlist.createdAt,
    })
    .from(waitlist)
    .where(eq(waitlist.id, parseInt(referrerId)))
    .limit(1);

  return referrer[0];
});
