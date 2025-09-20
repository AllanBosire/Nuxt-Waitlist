import { z } from "zod/v4-mini";
import { joinURL } from "ufo";

export interface LoggedInUser {
	id: string;
	create_at: number;
	update_at: number;
	delete_at: number;
	username: string;
	first_name: string;
	last_name: string;
	nickname: string;
	email: string;
	email_verified: boolean;
	auth_service: string;
	roles: string;
	locale: string;
	notify_props: NotifyProps;
	props: Props;
	last_password_update: number;
	last_picture_update: number;
	failed_attempts: number;
	mfa_active: boolean;
	timezone: Timezone;
	terms_of_service_id: string;
	terms_of_service_create_at: number;
}

interface NotifyProps {
	email: string;
	push: string;
	desktop: string;
	desktop_sound: string;
	mention_keys: string;
	channel: string;
	first_name: string;
	auto_responder_message: string;
	push_threads: string;
	comments: string;
	desktop_threads: string;
	email_threads: string;
}

interface Timezone {
	useAutomaticTimezone: string;
	manualTimezone: string;
	automaticTimezone: string;
}

const schema = z.object({
	it: z.string().check(z.minLength(10)),
	email: z.email(),
});

export default defineEventHandler(async (event) => {
	const { it, email } = await getValidatedQuery(event, schema.parse);
	const user = await getUserByEmail(email);

	const pswd = (key: string, pswd: string) => {
		const { data, error } = decrypt(pswd, key);
		if (error) {
			throw error;
		}

		if (!data) {
			throw createError("Unable to decrypt password");
		}

		return normalisePassword(data);
	};
	if (!user) {
		throw createError({ statusCode: 404, statusMessage: "No such user found" });
	}

	const config = useRuntimeConfig();
	if (!user.pswd) {
		throw createError({
			statusCode: 500,
			message: "It seems a duck has been found",
		});
	}

	const response = await $fetch.raw<LoggedInUser>(
		joinURL(config.mattermost.url, "/api/v4/users/login"),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: {
				login_id: email,
				password: pswd(it, user.pswd),
			},
		}
	);

	const mmToken = response.headers.get("Token");
	if (!mmToken) {
		throw createError({
			statusCode: 500,
			message: "Mattermost did not return a session token",
		});
	}

	const hostname = new URL(config.mattermost.url).hostname;

	setCookie(event, "MMAUTHTOKEN", mmToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		path: "/",
		domain: `.${hostname.split(".").slice(-2).join(".")}`,
	});

	return sendRedirect(event, config.public.mmUrl || config.public.appUrl || "/");
});
