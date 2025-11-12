import { waitlist } from "~~/server/database/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const email = body.email as string;

  const user = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1);
  if (user.length === 1) {
    return user[0];
  }
  return undefined;
});
