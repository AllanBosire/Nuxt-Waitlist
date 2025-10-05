import { z } from "zod";
import { ulid } from "ulid";

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

	const canInviteToken = ulid();
	const storage = useStorage("can-invite-tokens");
	await storage.setItem(canInviteToken, {
		name,
		createdAt: Date.now(),
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 day expiry
	});

	return { success: true, token: canInviteToken, expiresIn: 3600 };
});
