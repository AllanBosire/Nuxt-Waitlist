import { sendMail } from "../utils/mailer";
import { ulid } from "ulid";
import { z } from "zod";
import { useDrizzle, tables } from "../utils/drizzle";
import { eq } from "drizzle-orm";
import { render } from "@vue-email/render";
import { Invite } from "../templates/emails/views";

const schema = z.object({
	inviteToken: z.string().min(10),
	email: z.string().email(),
});

export default defineEventHandler(async (event) => {
	const { inviteToken, email } = schema.parse(await readBody(event));
	const config = useRuntimeConfig();

	// Validate the inviteToken (should be a bot or admin token)
	const validBot = Object.values(config.mattermost.bots).some(
		(bot: any) => bot.token && bot.token === inviteToken
	);
	const isAdmin = config.mattermost.admins
		.split(",")
		.some((admin: string) => admin.trim() !== "" && inviteToken === admin.trim());
	if (!validBot && !isAdmin) {
		throw createError({ statusCode: 401, statusMessage: "Invalid invite token" });
	}

	// Generate invite code
	const code = ulid();
	await useDrizzle()
		.insert(tables.invites)
		.values({
			code,
			created_by: validBot ? "bot" : "admin",
			is_active: true,
		})
		.execute();

	// Send invite email using vue-email template
	const inviteUrl = `${config.public.appUrl}/invite?code=${code}`;
	const html = await render(Invite, { inviteUrl, code });
	await sendMail({
		to: email,
		subject: "You're Invited to Join Finueva!",
		html,
	});

	return { success: true };
});
