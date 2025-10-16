import { z } from "zod/v4-mini";

const schema = z.object({
	survey: Survey,
	version: z.union([z.string(), z.number()]),
	user_id: z.string(),
});

export default defineEventHandler(async (event) => {
	const host = getRequestHost(event);
	const { survey, version, user_id } = await readValidatedBody(event, schema.parse);

	const { error } = await execute(
		useDrizzle()
			.insert(tables.surveys)
			.values({
				data: survey,
				version: String(version),
				user_id,
				host,
			})
			.onConflictDoUpdate({
				target: tables.surveys.user_id,
				set: {
					data: survey,
				},
			})
	);

	if (error) {
		throw createError({
			cause: error,
			message: "An error occurred when inserting data into the db",
		});
	}

	return "OK";
});
