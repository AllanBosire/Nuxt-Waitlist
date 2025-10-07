import { render } from "@vue-email/render";
import { consola } from "consola";
import { joinURL } from "ufo";
import { Invite } from "~~/server/templates/emails/views";

export function getInviteLink(token: string) {
	const config = useRuntimeConfig();
	return joinURL(config.public.appUrl) + "?token=" + token;
}

export function getInviteBotMessage(token: string) {
	const link = getInviteLink(token);
	return getMarkdown("invite", {
		link,
	});
}

export async function sendInviteKnowhowMessage(inviter_user_id: string, version: number | string) {
	const user = await getMatterMostUserbyId(inviter_user_id);
	if (!user) {
		throw createError("Unable to obtain mattermost user as invitor: " + inviter_user_id);
	}

	const bot = useMatterClient("invite");

	const token = createInviteToken(inviter_user_id);
	const { result: dmChannel, error: dmError } = await execute(bot.createDirectChannel, [
		await bot.userId(),
		inviter_user_id,
	]);
	if (dmError) {
		consola.fatal("Unable to create DM:", dmError);
		return;
	}

	const { markdown } = await getInviteBotMessage(token);
	const { error: postError } = await execute(bot.createPost, {
		channel_id: dmChannel.id,
		message: markdown,
	});
	if (postError) {
		consola.fatal("Unable to create post", postError);
		return;
	}

	const { error: dbUpdateError } = await execute(
		useDrizzle()
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

	consola.success("Sent Invite Knowhow to: ", inviter_user_id);
}

export async function sendInviteEmail(inviter_user_id: string, invitee_email: string) {
	const user = await getMatterMostUserbyId(inviter_user_id);
	if (!user) {
		throw createError("Unable to obtain mattermost user as invitor: " + inviter_user_id);
	}

	const code = createInviteToken(inviter_user_id);
	const inviteUrl = getInviteLink(code);

	const html = await render(Invite, { inviteUrl, code });
	const { error, result } = await execute(
		sendMail({
			to: invitee_email,
			subject: "You're Invited to Join Finueva!",
			html,
		})
	);

	if (error) {
		throw createError({
			message: "Failed to send invite",
			cause: error,
		});
	}

	consola.info("Successfully send invite mail to: ", invitee_email);
	return result;
}
