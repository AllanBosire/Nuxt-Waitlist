import { count, notLike } from 'drizzle-orm';

const excludedDomains = ['ifkafin.com', 'localhost'];

export default defineEventHandler(async () => {
  const entry = await useDrizzle()
    .select({ count: count() })
    .from(tables.waitlist)
    .where(
      and(
        ...excludedDomains.map((d) => notLike(tables.waitlist.email, `%${d}`))
      )
    );

  if (entry.length === 1) {
    return entry[0];
  }
  return null;
});
