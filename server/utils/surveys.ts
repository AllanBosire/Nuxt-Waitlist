import * as z from "zod/mini";

export const SurveyQuestion = z.object({
	question: z.string(),
	choices: z.array(z.string()),
	choice: z.optional(z.number()),
});

export const SurveyDescription = z.array(z.string());

export const SurveyItem = z.object({
	header: z.string(),
	subheading: z.optional(z.string()),
	body: z.union([SurveyQuestion, SurveyDescription]),
});

export const SurveySchema = z.object({
	user_id: z.string(),
	version: z.union([z.number(), z.string()]),
	survey: z.array(SurveyItem),
});

export type Survey = z.input<typeof SurveySchema>;
export type SurveySurveyItem = z.input<typeof SurveyItem>;
export type SurveyQuestion = z.input<typeof SurveyQuestion>;
