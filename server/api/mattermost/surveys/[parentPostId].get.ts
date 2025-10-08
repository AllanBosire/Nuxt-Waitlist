import { z } from "zod/v4-mini";

const ParamsSchema = z.object({
	parentPostId: z.string().check(z.minLength(1)),
});

const config = useRuntimeConfig();
const QuerySchema = z.object({
	bot: z.enum(toArray(keys(config.mattermost.bots))),
});

export default defineEventHandler(async (event) => {
	const parsed = await getValidatedRouterParams(event, ParamsSchema.parse);
	const bot = await getValidatedQuery(event, QuerySchema.parse);

	return getSurveyStats(bot as any, parsed.parentPostId);
});
