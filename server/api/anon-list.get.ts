import { waitlist } from "../database/schema";

function anonymize(item: { email: string }) {
	const regex = /(?<=.)[^@](?=[^@]*?@)|(?:(?<=@.)|(?!^)\\G(?=[^@]*$)).(?=.*\\.)/gm;
	const substitution = `*`;
	return item.email.replace(regex, substitution);
}

export default defineEventHandler(async (event) => {
	const raw = await useDrizzle().select({ email: waitlist.email }).from(tables.waitlist);
	const cookie = getCookie(event, "waitlistEmail");
	const entries = raw.map((entry) => {
		if (entry.email === cookie) {
			return entry.email;
		}
		return anonymize(entry);
	});
	return entries;
});
