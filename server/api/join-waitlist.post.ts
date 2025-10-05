import { consola } from "consola";
import { z } from "zod";

const schema = z.object({
	email: z.email().refine(async (email) => {
		const alreadyExists = await useDrizzle().query.waitlist.findFirst({
			where: (waitlist, { eq }) => eq(waitlist.email, email),
		});
		return !alreadyExists;
	}, "Email is already in use"),
	username: z.optional(z.string().min(4)),
	referrer: z.optional(z.string()),
	inviteCode: z.string().min(6, "Invite code required"),
});

export default defineEventHandler(async (event) => {
	consola.info("User trying to signup for waitlist...");
	let { email, username, referrer, inviteCode } = await readValidatedBody(
		event,
		schema.parseAsync
	);
	if (!username) {
		username = email.split("@")[0]!;
	}

	const invite = await useDrizzle().query.invites.findFirst({
		where: (invites, { eq, and, isNull }) =>
			and(eq(invites.code, inviteCode), eq(invites.is_active, true), isNull(invites.used_by)),
	});
	if (!invite) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid or already used invite code.",
		});
	}

	consola.info("User joining waitlist...", email);
	const entry = await useDrizzle()
		.insert(tables.waitlist)
		.values({
			email,
			createdAt: new Date(),
			referrer: referrer ?? null,
			invite_code: inviteCode,
		})
		.returning()
		.execute()
		.then((res) => res[0]);

	await useDrizzle()
		.update(tables.invites)
		.set({
			used_by: email,
			used_at: new Date(),
			is_active: false,
		})
		.where(eq(tables.invites.code, inviteCode))
		.execute();

	createMattermostUser({
		email,
		username,
	})
		.then((result) => {
			if (!result) {
				throw createError("Unable to create mattermost user");
			}

			sendWelcomeEmail({
				link: result.link,
				email: result.user.email,
				username: result.user.username,
				password: result.pswd,
			});
		})
		.catch((error) => {
			consola.error(error);
			consola.fatal("Could not create mattermost user", error.message);
		});

	consola.info(`User ${entry.email} is now on waitlist...`);
	setCookie(event, "waitlistEmail", entry.email, {
		httpOnly: false,
		maxAge: 60 * 60 * 24 * 30, // 30 days
	});
	return entry;
});
