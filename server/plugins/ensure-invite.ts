import { consola } from "consola";

export default defineEventHandler(async () => {
	const db = useDrizzle();
	const { version } = useRuntimeConfig().mattermost.bots.invite;
	const needLinks = import.meta.dev
		? [{ email: "archiethebig@gmail.com" }]
		: await db.query.waitlist.findMany({
				where(fields, { sql, or, isNull, eq }) {
					return or(
						isNull(fields.sent_bot_messages),
						eq(fields.sent_bot_messages, sql`'{}'::jsonb`),
						sql`(${fields.sent_bot_messages}->'invite') = '{}'::jsonb`,
						sql`
				EXISTS (
					SELECT 1
					FROM jsonb_each_text(${fields.sent_bot_messages}->'invite') AS elem(version_key, value)
					WHERE version_key ~ '^[0-9]+$'
					AND (version_key)::int < ${toNumber(version)}
				)
			`
					);
				},
		  });

	needLinks.forEach(async (user) => {
		const { result, error } = await execute(getMatterMostUserByEmail, user.email);
		if (error) {
			consola.fatal(error);
			return;
		}

		// const link = await gen
	});
});
