import { z } from "zod/v4-mini";

const config = useRuntimeConfig();
const schema = z.object({
	botId: z.enum(toArray(keys(config.mattermost.bots))),
	recipients: z.union([
		z.array(z.string()).check(z.minLength(1, "Please select at least one recipient")),
		z.literal(true),
	]),
	message: z.string(),
});

export default defineEventHandler(async (event) => {
	const admin = await ensureAdmin(event);
	const { botId, recipients, message } = await readValidatedBody(event, schema.parse);

	const bot = config.mattermost.bots[botId];

	if (!bot) {
		throw createError({
			statusCode: 404,
			message: "Bot not found",
		});
	}

	var emails: string[] = [];
	if (recipients === true) {
		// TODO: Chunk
		const users = await useDrizzle()
			.select({
				email: tables.waitlist.email,
			})
			.from(tables.waitlist);
		users.forEach((u) => {
			emails.push(u.email);
		});
	} else {
		emails = recipients;
	}

	const promises = emails.map(async (email: string) => {
		const user = await getMatterMostUserByEmail(email);
		if (!user) {
			throw createError("User not found");
		}

		return sendMessageToUser(user.id, message, botId);
	});

	const result = await settle(promises);

	await useDrizzle()
		.insert(tables.broadcastMessages)
		.values({
			bot: botId,
			content: message,
			recipients: emails,
			sender: admin.email,
		})
		.execute();
	return result;
});
