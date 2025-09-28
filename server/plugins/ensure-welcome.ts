import { useMatterClient } from "@@/server/utils/mattermost/client";
import { consola } from "consola";
import { getMatterMostUserByEmail } from "../utils/mattermost";
import { deleteUser } from "../utils/user";
import { sendWelcomeMessage } from "../utils/messages/welcome";

export default defineNitroPlugin(async () => {
	const db = useDrizzle();

	const { version } = useRuntimeConfig().mattermost.bots.welcome;
	const needInvites = await db.query.waitlist.findMany({
		where(fields, { sql, or, isNull, eq }) {
			return or(
				isNull(fields.sent_bot_messages),
				eq(fields.sent_bot_messages, sql`'{}'::jsonb`),
				sql`(${fields.sent_bot_messages}->'welcome') = '{}'::jsonb`,
				sql`
				EXISTS (
					SELECT 1
					FROM jsonb_each_text(${fields.sent_bot_messages}->'welcome') AS elem(version_key, value)
					WHERE version_key ~ '^[0-9]+$'
					AND (version_key)::int < ${toNumber(version)}
				)
			`
			);
		},
	});

	const bot = useMatterClient("welcome");
	const botSocket = bot.getWebSocket();
	botSocket.on("new_user", async (message: { user_id?: string }) => {
		if (!message.user_id) {
			console.error("New user has no user id");
			return;
		}
	});

	needInvites.forEach(async (user) => {
		const { result, error } = await execute(getMatterMostUserByEmail, user.email);
		if (error) {
			consola.fatal(error);
			return;
		}

		if (!result) {
			return deleteUser(user.email);
		}

		sendWelcomeMessage(result.id, version);
	});

	consola.success("Listening for user registrations");
});
