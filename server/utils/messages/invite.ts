import { consola } from "consola";
import { joinURL } from "ufo";

export function getInviteBotMessage(token: string) {
	const config = useRuntimeConfig();
	const link = joinURL(config.public.appUrl) + "?code=" + token;
	return getMarkdown("invite", {
		link,
	});
}

export async function sendInviteMessage(user_id: string, version: number | string, skip = false) {
	const user = await getMatterMostUserbyId(user_id);
	if (!user) {
		throw createError("Unable to obtain mattermost user: " + user_id);
	}

	const bot = useMatterClient("invite");
	if (!bot) {
		throw createError("No invite bot found");
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

	const { markdown } = await getInviteBotMessage(user);
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
          'invite', 
          COALESCE(${tables.waitlist.sent_bot_messages}->'invite', '{}'::jsonb) || 
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

	consola.success("Sent Invite DM to ", user_id);
}
