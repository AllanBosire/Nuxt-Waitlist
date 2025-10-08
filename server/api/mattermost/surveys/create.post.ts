import { z } from "zod/v4-mini";

const PollQuestionSchema = z.object({
	type: z.literal("poll"),
	question: z.string().check(z.minLength(1)),
	options: z.array(z.string().check(z.minLength(1))),
	multiple: z.optional(z.boolean()),
	flags: z.optional(z.array(z.string())),
});

const TextQuestionSchema = z.object({
	type: z.literal("text"),
	question: z.string().check(z.minLength(1)),
	instructions: z.optional(z.string()),
});

const QuestionSchema = z.union([PollQuestionSchema, TextQuestionSchema]);

const config = useRuntimeConfig();
const CreateSurveyBody = z.object({
	bot: z.enum(toArray(keys(config.mattermost.bots))),
	channelId: z.string().check(z.minLength(1)),
	title: z.string().check(z.minLength(1)),
	questions: z.array(QuestionSchema).check(z.minLength(1)),
});

export default defineEventHandler(async (event) => {
	const { bot, channelId, title, questions } = await readValidatedBody(
		event,
		CreateSurveyBody.parse
	);

	return sendSurvey(bot, channelId, title, questions);
});
