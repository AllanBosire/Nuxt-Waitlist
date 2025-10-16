import { z } from "zod/v4-mini";

export const Question = z.object({
	question: z.string(),
	choices: z.array(z.string()),
	choice: z.union([z.string(), z.number(), z.null()]),
});

export const Survey = z.object({
	header: z.string(),
	subheading: z.optional(z.string()),
	body: z.union([Question, z.array(z.string())]),
});

export type Question = z.input<typeof Question>;
export type Survey = z.input<typeof Survey>;
