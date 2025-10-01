import { z, safeParse } from "zod/v4-mini";

type ZodSafeParseResult<T> =
	| { success: true; data: T; error: undefined }
	| { success: false; error: z.core.$ZodError; data: undefined };

type FlattenedError = ReturnType<typeof z.flattenError>;
type PrettifiedError = ReturnType<typeof z.prettifyError>;

type ValidateParams = Partial<z.core.ParseContext<z.core.$ZodIssue>> &
	OneOf<[{ prettifyError?: boolean; breaks?: boolean }, { flattenError?: boolean }]>;

export type ZInfer<T extends z.core.$ZodShape> = {
	[K in keyof T]: T[K] extends z.core.$ZodType<any, any> ? z.infer<T[K]> : never;
};

function replaceNewlinesWithSymbol(text: string) {
	return text.replace(/\n/g, "⏎\u00A0");
}

export function validate<T extends z.core.$ZodShape>(
	schema: z.core.$ZodObject<T>,
	data: unknown,
	params: ValidateParams & {
		flattenError: true;
	}
): { success: false; error: FlattenedError } | { success: true; data: z.infer<typeof schema> };
export function validate<T extends z.core.$ZodShape>(
	schema: z.core.$ZodObject<T>,
	data: unknown,
	params: ValidateParams & {
		prettifyError: true;
		breaks?: boolean;
	}
): { success: false; error: PrettifiedError } | { success: true; data: z.infer<typeof schema> };
export function validate<T extends z.core.$ZodShape>(
	schema: z.core.$ZodObject<T>,
	data: unknown,
	params?: ValidateParams
): ZodSafeParseResult<z.infer<typeof schema>>;
export function validate<T extends z.core.$ZodShape>(
	schema: z.core.$ZodObject<T>,
	data: unknown,
	params?: ValidateParams
) {
	const result = safeParse(schema, data, params) as any;
	if (result.error) {
		if (params?.flattenError) {
			result.error = z.flattenError(result.error);
		} else if (params?.prettifyError) {
			result.error = z.prettifyError(result.error);

			if (params.breaks) {
				result.error = replaceNewlinesWithSymbol(result.error);
			}
		}
	}
	return result;
}

export default function <T extends z.core.$ZodShape>(schema: z.core.$ZodObject<T>) {
	const data = reactive<Partial<z.infer<typeof schema>>>({});

	return {
		data,
		validate(params?: ValidateParams) {
			return validate(schema, data, params);
		},
	};
}
