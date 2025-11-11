import { waitlist } from "~~/server/database/schema";
import paginationSchema from "../../../../utils/schemas";
export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const referrerMMId = body.referrer as string;

  const { page, items } = await getValidatedQuery(
    event,
    paginationSchema.parse
  );

  const refereesDb = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      createdAt: waitlist.createdAt,
      referrer: waitlist.referrer,
    })
    .from(waitlist)
    .where(eq(waitlist.referrer, referrerMMId))
    .limit(items)
    .offset((page - 1) * items);

  const referees = await Promise.all(
    refereesDb.map(async (referee) => {
      const mmUser = await getMatterMostUserById(referee.referrer!);
      const referrerUsername = mmUser?.username || "";

      const mmRefereeUser = await getMatterMostUserByEmail(referee.email);

      return {
        ...referee,
        referrer: referrerUsername,
        username: mmRefereeUser?.username || "",
      };
    })
  );

  return referees;
});
