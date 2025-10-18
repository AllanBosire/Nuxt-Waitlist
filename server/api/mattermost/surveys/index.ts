import {z} from "zod/v4-mini";
import {collectPollAnalytics} from "~~/server/utils/mattermost/matterpoll";

const config = useRuntimeConfig();
const QuerySchema = z.object({
    bot: z.optional(z.enum(toArray(keys(config.mattermost.bots)))),
    channelId: z.optional(z.string().check(z.minLength(1, "channelId is required"))),
    withStats: z.optional(z.union([z.boolean(), z.number()])),
});

export default defineEventHandler(async (event) => {
    const {bot = 'surveys', channelId, withStats} = await getValidatedQuery(event, QuerySchema.parse);

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

        const detailed = [];
        for (const poll of analytics.polls) {
            try {
                const stats = await getSurveyStats(bot as any, poll.surveyId);
                detailed.push(stats);
            } catch (_) {
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
            data: {message: err?.message, cause: err},
        });
    }
});
