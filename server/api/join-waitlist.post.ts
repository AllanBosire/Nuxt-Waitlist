import { consola } from "consola";
import { z } from "zod";

const schema = z.object({
	email: z.email().refine(async (email) => {
		const alreadyExists = await getMatterMostUserByEmail(email);
		return !alreadyExists;
	}, "Email is already in use"),
	password: z.string().min(4),
	token: z.string(),
});

function isLocalhostOrIP(domain?: string): boolean {
	if (!domain) return true;
	return (
		domain === "localhost" || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain) // IPv4
	);
}

/**
 * Returns consistent cookie settings, same as the Go backend.
 */
export function getCookiePolicy(event: any, domain?: string) {
	const protocol = event.node.req.headers["x-forwarded-proto"] || "http";
	const secure = protocol === "https";

	const maxAgeSeconds = Number(process.env.SESSION_LENGTH_HOURS || 24) * 60 * 60;
	const expires = new Date(Date.now() + maxAgeSeconds * 1000);

	const dev = isLocalhostOrIP(domain);

	let cookieDomain: string | undefined;
	let sameSite: "lax" | "none";
	let cookieSecure: boolean;

	if (dev) {
		cookieDomain = undefined;
		sameSite = "lax";
		cookieSecure = secure;
	} else {
		cookieDomain = domain;
		sameSite = "none";
		cookieSecure = true;
	}

	return {
		httpOnly: true,
		secure: cookieSecure,
		sameSite,
		domain: cookieDomain,
		path: "/",
		expires,
		maxAge: maxAgeSeconds,
	};
}

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
		.onConflictDoNothing()
		.returning()
		.execute()
		.then((res) => res[0]);

	const result = await createMattermostUser({
		email,
		password,
	})
		.catch((error) => {
			consola.error(error);
			consola.fatal("Could not create mattermost user", error.message);
			return undefined;
		})
		.finally(() => {
			consola.info(`User ${user.email} is now on mattermost`);
			return undefined;
		});

	if (!result) {
		sendEmergencyEmailToDev("User unable to join Mattermost: ", user.email, user.pswd);
		throw createError("Unable to create mattermost user");
	}

	execute(sendWelcomeEmail, {
		link: result.link,
		email: result.user.email,
		username: result.user.username,
	});

	execute(inValidateToken, token, result.user.email);
	execute(sendInviteUpdateMessage, valid.created_by, result.user.username);

	consola.info(`User ${user.email} is now on waitlist...`);
	setCookie(event, "waitlistEmail", user.email, {
		httpOnly: false,
		maxAge: 60 * 60 * 24 * 30,
	});

	return "OK";
});
