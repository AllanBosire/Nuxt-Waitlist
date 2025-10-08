import { z } from "zod/v4-mini";

const config = useRuntimeConfig();
const schema = z.object({
	name: z.enum(toArray(keys(config.mattermost.bots))),
	secret: z.string().check(z.minLength(10)),
	for_email: z.optional(z.string()),
});

export default defineEventHandler(async (event) => {
	const { name, secret, for_email = null } = await readValidatedBody(event, schema.parse);
	const config = useRuntimeConfig();

	const bot = config.mattermost.bots[name];
	if (!bot || bot.token !== secret) {
		throw createError({ statusCode: 401, statusMessage: "Invalid bot credentials" });
	}

	const id = await useMatterClient(name).userId();
	return createInviteToken(id, for_email);
});
