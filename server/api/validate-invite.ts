import { z } from "zod/v4-mini";

const schema = z.object({
	secret: z.string().check(z.minLength(10)),
});

export default defineEventHandler(async (event) => {
	const { secret } = await readValidatedBody(event, schema.parse);
	return validateToken(secret);
});
