import { useMatterClient } from "@@/server/utils/mattermost/client";
import { getMatterMostUserbyId } from "../utils/mattermost";

export default defineNitroPlugin(async () => {
	const db = useDrizzle();

	const { version } = useRuntimeConfig().mattermost.bots.welcome;
	const needInvites = await db.query.waitlist.findMany({
		where(fields, { sql, or, isNull }) {
			return or(
				isNull(fields.sent_bot_messages),
				sql`
        EXISTS (
          SELECT 1
          FROM jsonb_each_text(${fields.sent_bot_messages}->'welcome') AS elem(version_key, value)
          WHERE (version_key)::int < ${toNumber(version)}
        )
      `
			);
		},
	});

	const bot = useMatterClient("welcome");
	bot.getWebSocket().on("new_user", async (message: { user_id?: string }) => {
		if (!message.user_id) {
			console.error("New user has no user id");
			return;
		}

		const user = await getMatterMostUserbyId(message.user_id);
		if (!user) {
			return console.error("Could not get mattermost user");
		}
	});

	needInvites.forEach((user) => {
		console.log(user);
	});
});
