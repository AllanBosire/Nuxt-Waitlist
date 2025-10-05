import { z } from "zod";
import { useDrizzle, tables } from "../utils/drizzle";
import { ulid } from "ulid";

const schema = z.object({
	token: z.string().min(10),
	email: z.email(),
});

export default defineEventHandler(async (event) => {
	const { token, email } = await readValidatedBody(event, schema.parse);
	const config = useRuntimeConfig();
	const validBot = Object.values(config.mattermost.bots).some(
		(bot: any) => bot.token && bot.token === token
	);
	const isAdmin = await ensureAdmin(event).catch(() => false);
	if (!validBot && !isAdmin) {
		throw createError({ statusCode: 401, statusMessage: "Invalid can-invite-token" });
	}

	const code = ulid();
	await useDrizzle()
		.insert(tables.invites)
		.values({
			code,
			created_by: validBot ? "bot" : "admin",
			is_active: true,
		})
		.execute();

	// TODO: Send invite email (implement with your mailer)

	return { success: true, code };
});
