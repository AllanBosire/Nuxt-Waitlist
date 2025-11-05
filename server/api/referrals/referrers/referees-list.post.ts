import { bindIfParam } from "drizzle-orm";
import { waitlist } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const referrerMMId = body.id as string;

  const referees = await db
    .select({ email: waitlist.email, inviteDate: waitlist.createdAt })
    .from(waitlist)
    .where(eq(waitlist.referrer, referrerMMId));

  return referees;
});
