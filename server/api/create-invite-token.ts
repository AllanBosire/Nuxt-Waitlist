import { z } from "zod";

const config = useRuntimeConfig();
const schema = z.object({
	name: z.enum(toArray(keys(config.mattermost.bots))),
	secret: z.string().min(10),
});

export default defineEventHandler(async (event) => {
	const { name, secret } = await readValidatedBody(event, schema.parse);
	const config = useRuntimeConfig();

	const bot = config.mattermost.bots[name];
	if (!bot || bot.token !== secret) {
		throw createError({ statusCode: 401, statusMessage: "Invalid bot credentials" });
	}

	const id = await useMatterClient(name).userId();
	return createInviteToken(id);
});
