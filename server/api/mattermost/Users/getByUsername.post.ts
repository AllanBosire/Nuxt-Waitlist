export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const username = body.username as string;
  const mmUser = await getMatterMostUserBy(username);
  console.log("{} " + mmUser);
  if (!mmUser) {
    return undefined;
  }
  return mmUser;
});
