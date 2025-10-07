import { z } from "zod/v4-mini";
import { sendInviteEmail } from "../utils/messages/invite";

const schema = z.object({
	inviteToken: z.optional(z.string().check(z.minLength(10))),
	email: z.email(),
});

export default defineEventHandler(async (event) => {
	const { inviteToken, email } = schema.parse(await readBody(event));
	const config = useRuntimeConfig();

	const bots = toArray(entries(config.mattermost.bots));
	const validBot = bots.find(([_, bot]) => bot.token && bot.token === inviteToken);

	const isAdmin = await ensureAdmin(event).catch(() => undefined);

	let user_id: string | undefined;
	if (validBot) {
		user_id = await useMatterClient(validBot[0]).userId();
	} else if (isAdmin) {
		user_id = isAdmin.id;
	}

	if (!user_id) {
		throw createError({ statusCode: 401, statusMessage: "Invalid invite token" });
	}
	sendInviteEmail(user_id, email);
	return "OK";
});
