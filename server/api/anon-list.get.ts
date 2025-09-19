import { useDrizzle } from "~~/server/utils/drizzle";
import { waitlist } from "../database/schema";

function anonymize(item: { email: string }) {
	const regex = /(?<=.)[^@](?=[^@]*?@)|(?:(?<=@.)|(?!^)\\G(?=[^@]*$)).(?=.*\\.)/gm;
	const substitution = `*`;
	return item.email.replace(regex, substitution);
}

export default defineEventHandler(async (event) => {
	const entry = (await useDrizzle().select({ email: waitlist.email }).from(tables.waitlist)).map(
		anonymize
	);

	return entry;
});
