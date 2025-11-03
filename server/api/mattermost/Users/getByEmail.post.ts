export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = body.email as string;
  const mattermostUser = await getMatterMostUserByEmail(email);

  return mattermostUser;
});
