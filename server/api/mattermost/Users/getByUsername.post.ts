export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const username = body.username as string;
  const mmUser = await getMatterMostUserByUsername(username);

  if (!mmUser) {
    return undefined;
  }
  return mmUser;
});
