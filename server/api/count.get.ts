import { count, notLike } from 'drizzle-orm';
import { ExcludedDomains } from '~~/server/utils/constants';

export default defineEventHandler(async () => {
  const entry = await useDrizzle()
    .select({ count: count() })
    .from(tables.waitlist)
    .where(
      and(
        ...ExcludedDomains.map((d) => notLike(tables.waitlist.email, `%${d}`))
      )
    );

  if (entry.length === 1) {
    return entry[0];
  }
  return null;
});
