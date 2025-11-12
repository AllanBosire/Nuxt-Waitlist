export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const id = body.id as string;

  const matterMostUser = await getMatterMostUserById(id);

  return matterMostUser;
});
