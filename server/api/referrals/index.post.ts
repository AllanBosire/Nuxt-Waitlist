import { waitlist } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const email = body.email as string;

  const user = await getMatterMostUserByEmail(email);
  const id = user?.id;

  if (!id) return [];

  const referrals = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      referrer: waitlist.referrer,
      createdAt: waitlist.createdAt,
    })
    .from(waitlist)
    .where(eq(waitlist.referrer, id));

  return referrals;
});
