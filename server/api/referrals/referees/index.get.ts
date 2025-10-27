import { isNotNull } from 'drizzle-orm';
import { waitlist } from '~~/server/database/schema';

export default defineEventHandler(async () => {
  const db = useDrizzle();

  const referees = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      referrer: waitlist.referrer,
      createdAt: waitlist.createdAt,
    })
    .from(waitlist)
    .where(isNotNull(waitlist.referrer));

  return referees;
});
