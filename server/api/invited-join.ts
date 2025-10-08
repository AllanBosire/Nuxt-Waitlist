import { z } from "zod/v4-mini";

const schema = z.object({
	code: z.string(),
});

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { code } = schema.parse(body);

	const invite = await useDrizzle().query.invites.findFirst({
		where: (invites, { eq, and, isNull }) =>
			and(eq(invites.code, code), eq(invites.is_active, true), isNull(invites.used_by)),
	});

	if (!invite) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid or already used invite code.",
		});
	}

	return "OK";
});
