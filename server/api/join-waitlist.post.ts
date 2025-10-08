import { consola } from "consola";
import { z } from "zod";

const schema = z.object({
	email: z.email().refine(async (email) => {
		const alreadyExists = await useDrizzle().query.waitlist.findFirst({
			where: (waitlist, { eq }) => eq(waitlist.email, email),
		});
		return !alreadyExists;
	}, "Email is already in use"),
	password: z.string().min(4),
	token: z.string(),
});

export default defineEventHandler(async (event) => {
	consola.info("User trying to signup for waitlist...");
	const { email, password, token } = await readValidatedBody(event, schema.parseAsync);

	const valid = await validateToken(token);
	if (!valid) {
		throw createError({
			message: "Invalid or already used invite code.",
			statusCode: 400,
		});
	}

	consola.info("User joining waitlist...", email);
	const user = await useDrizzle()
		.insert(tables.waitlist)
		.values({
			email,
			createdAt: new Date(),
			referrer: valid.created_by,
			invite_code: token,
		})
		.returning()
		.execute()
		.then((res) => res[0]);

	createMattermostUser({
		email,
		password,
	})
		.then((result) => {
			if (!result) {
				throw createError("Unable to create mattermost user");
			}
			execute(sendWelcomeEmail, {
				link: result.link,
				email: result.user.email,
				username: result.user.username,
			});

			execute(inValidateToken, token, result.user.email);
			execute(sendInviteUpdateMessage, valid.created_by, result.user.username);
		})
		.catch((error) => {
			consola.error(error);
			consola.fatal("Could not create mattermost user", error.message);
		})
		.finally(() => {
			consola.info(`User ${user.email} is now on mattermost`);
		});

	consola.info(`User ${user.email} is now on waitlist...`);
	setCookie(event, "waitlistEmail", user.email, {
		httpOnly: false,
		maxAge: 60 * 60 * 24 * 30,
	});
	return user;
});
