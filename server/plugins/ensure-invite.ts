import { consola } from "consola";
import { sendInviteEmail } from "../utils/messages/invite";

const emailRegex =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

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

		if (!result) {
			consola.fatal("No such mattermost user");
			return;
		}

		sendInviteKnowhowMessage(result.id, version);
	});

	const inviteBot = useMatterClient("invite");

	const BOT_ID = await inviteBot.userId();
	inviteBot.getWebSocket().on("posted", (data: IncomingPostEvent) => {
		const { message, user_id } = tryParse<Post>(data.post);
		if (user_id === BOT_ID) {
			return;
		}

		if (import.meta.dev) {
			consola.info("Bot received message", message);
		}

		const emails = String(message).matchAll(emailRegex);
		emails.forEach(([email]) => {
			sendInviteEmail(user_id, email);
		});
	});
});
