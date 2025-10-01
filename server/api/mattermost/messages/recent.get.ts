import { z } from "zod/v4-mini";

const config = useRuntimeConfig();
const schema = z.object({
	botId: z.optional(z.enum(toArray(keys(config.mattermost.bots)))),
});

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);
	let { botId } = await getValidatedQuery(event, schema.parse);

	if (!botId) {
		botId = peek(keys(config.mattermost.bots)!);
	}

	if (!botId) {
		throw createError("Unable to obtain botId");
	}

	return useDrizzle()
		.select()
		.from(tables.broadcastMessages)
		.where(eq(tables.broadcastMessages.bot, botId));
});
