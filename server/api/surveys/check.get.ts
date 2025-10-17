import { z } from "zod/v4-mini";

const schema = z.object({
	user_id: z.string(),
	version: z.string(),
});
export default defineEventHandler(async (event) => {
	const { user_id, version } = await getValidatedQuery(event, schema.parse);
	const data = await useDrizzle().query.surveys.findFirst({
		where(fields, operators) {
			return and(
				operators.eq(fields.user_id, user_id),
				operators.eq(fields.version, version)
			);
		},
	});

	if (!data) {
		throw createError({
			message: "No user data found",
			statusCode: 410,
		});
	}

	return "OK";
});
