import { ExcludedDomains } from "~~/server/utils/constants";
import { waitlist } from "../database/schema";
import { notLike } from "drizzle-orm";

function anonymize(item: { email: string }) {
  const regex =
    /(?<=.)[^@](?=[^@]*?@)|(?:(?<=@.)|(?!^)\\G(?=[^@]*$)).(?=.*\\.)/gm;
  const substitution = `*`;
  return item.email.replace(regex, substitution);
}

export default defineEventHandler(async (event) => {
  const raw = await useDrizzle()
    .select({ email: waitlist.email })
    .from(tables.waitlist)
    .where(
      and(
        ...ExcludedDomains.map((d) => notLike(tables.waitlist.email, `%${d}`))
      )
    );
  const cookie = getCookie(event, "waitlistEmail");
  const entries = raw.map((entry) => {
    if (entry.email === cookie) {
      return entry.email;
    }
    return anonymize(entry);
  });
  return entries;
});
