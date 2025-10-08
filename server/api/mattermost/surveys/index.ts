import { z } from "zod/v4";
import { collectPollAnalytics } from "~~/server/utils/mattermost/matterpoll";

const config = useRuntimeConfig();
const QuerySchema = z.object({
	bot: z.enum(toArray(keys(config.mattermost.bots))),
	channelId: z.string().check(z.minLength(1, "channelId is required")),
	withStats: z
		.string()
		.optional()
		.transform((v) => v === "true" || v === "1" || v === "yes"),
});

export default defineEventHandler(async (event) => {
	const { bot, channelId, withStats } = await getValidatedQuery(event, QuerySchema.parse);

	try {
		// Retrieve all polls/surveys in the channel
		const analytics = await collectPollAnalytics(bot, channelId);

		if (!withStats) {
			return {
				ok: true,
				surveys: analytics.polls,
				summary: analytics.aggregated,
			};
		}

		// If withStats=true, fetch detailed stats for each
		const detailed = [];
		for (const poll of analytics.polls) {
			try {
				const stats = await getSurveyStats(bot as any, poll.surveyId);
				detailed.push(stats);
			} catch {
				continue;
			}
		}

		return {
			ok: true,
			surveys: detailed,
			summary: analytics.aggregated,
		};
	} catch (err: any) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to retrieve surveys",
			data: { message: err?.message, cause: err },
		});
	}
});
