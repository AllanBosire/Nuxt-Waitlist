import { consola } from "consola";

export function getWelcomeBotMessage(user: MMUser) {
	return getMarkdown("welcome", {
		username: user.username,
	});
}

export async function sendWelcomeMessage(user_id: string, version: number | string, skip = false) {
	const user = await getMatterMostUserbyId(user_id);
	if (!user) {
		throw createError("Unable to obtain mattermost user: " + user_id);
	}

	const bot = useMatterClient("welcome");
	if (!bot) {
		throw createError("No welcome bot found");
	}

	if (!user_id) {
		throw createError("No user Id passed to function");
	}

	const { result: dmChannel, error: dmError } = await execute(bot.createDirectChannel, [
		await bot.userId(),
		user_id,
	]);

	if (dmError) {
		consola.fatal("Unable to create DM:", dmError);
		return;
	}

	const { markdown } = await getWelcomeBotMessage(user);
	if (!skip) {
		const { error: postError } = await execute(bot.createPost, {
			channel_id: dmChannel.id,
			message: markdown,
		});
		if (postError) {
			consola.fatal("Unable to create post", postError);
			return;
		}
	}

	const db = useDrizzle();
	const { error: dbUpdateError } = await execute(
		db
			.update(tables.waitlist)
			.set({
				sent_bot_messages: sql`
        COALESCE(${tables.waitlist.sent_bot_messages}, '{}'::jsonb) || 
        jsonb_build_object(
          'welcome', 
          COALESCE(${tables.waitlist.sent_bot_messages}->'welcome', '{}'::jsonb) || 
          jsonb_build_object(${version}::text, true)
        )
      `,
			})
			.where(eq(tables.waitlist.email, user.email))
			.execute()
	);

	if (dbUpdateError) {
		consola.fail("Unable to update send message version: ", dbUpdateError);
		return;
	}

	consola.success("Sent Welcome DM to ", user_id);
}
