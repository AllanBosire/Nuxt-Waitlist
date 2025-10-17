export default defineEventHandler(async (event) => {
	const host = getRequestHost(event);
	const body = await readBody(event);

	const { survey, version, user_id } = SurveySchema.parse(
		typeof body === "string" ? JSON.parse(body) : body
	);

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
