import { joinURL } from "ufo";
import { consola } from "consola";
import { v7, v4 } from "uuid";
import { eq } from "drizzle-orm";

export interface MattermostUserCreateResponse {
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

export interface NotifyProps {
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

export interface Props {}

export interface Timezone {
	useAutomaticTimezone: string;
	manualTimezone: string;
	automaticTimezone: string;
}

export function addUserToTeam(userId: string, teamId: string) {
	const config = useRuntimeConfig();
	return $fetch(joinURL(config.mattermost.url, `/api/v4/teams/${teamId}/members`), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.mattermost.token}`,
			"Content-Type": "application/json",
		},
		body: { team_id: teamId, user_id: userId },
	});
}

export function createMagicLink(token: string, email: string) {
	const config = useRuntimeConfig();
	return joinURL(config.public.appUrl, `/token?it=${token}&email=${email}`);
}

export function getUserByEmail(email: string) {
	return useDrizzle().query.waitlist.findFirst({
		where: (user, { eq }) => eq(user.email, email),
	});
}

export async function createMattermostUser(_user: { username: string; email: string }) {
	const config = useRuntimeConfig();
	const token = v7();
	const rawPswd = v4();
	const user = await $fetch<MattermostUserCreateResponse>(
		joinURL(config.mattermost.url, "/api/v4/users"),
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.mattermost.token}`,
			},
			body: {
				email: _user.email,
				username: normaliseUsername(_user.username),
				password: normalisePassword(rawPswd),
			},
			onResponseError({ response }) {
				consola.error(response._data);
			},
		}
	);

	if (!user) {
		consola.fatal("Could not create mattermost user");
		return undefined;
	}

	const { data: pswd, error } = encrypt(rawPswd, token);
	if (error || !pswd) {
		throw createError({
			message: "Encountered an error while attempting encryption",
			cause: error,
		});
	}

	useDrizzle()
		.update(tables.waitlist)
		.set({
			pswd: pswd,
		})
		.where(eq(tables.waitlist.email, _user.email))
		.execute()
		.catch((e) => {
			consola.error(e);
			consola.fatal("Could not set db password", e.message);
		});

	addUserToTeam(user.id, config.mattermost.team_id).catch((e) => {
		consola.error(e);
		consola.fatal("Could not add mattermost user to finueva team");
	});

	const link = createMagicLink(token, user.email);
	return {
		user,
		link,
		pswd: normalisePassword(rawPswd),
	};
}

export function normalisePassword(pswd: string): string {
	if (typeof pswd !== "string") {
		throw new TypeError("Password must be a string");
	}

	// Trim whitespace
	const clean = pswd.trim();

	// Truncate to max bcrypt-supported length
	return clean.length > 72 ? clean.slice(0, 72) : clean;
}

export function normaliseUsername(name: string): string {
	if (typeof name !== "string") {
		throw new TypeError("Username must be a string");
	}

	// 1. Lowercase the username
	let clean = name.toLowerCase().trim();

	// 2. Remove invalid characters (allow only [a-z0-9._-])
	clean = clean.replace(/[^a-z0-9._-]/g, "");

	// 3. Ensure it doesn't start with a dot
	clean = clean.replace(/^\.+/, "");

	// 4. Enforce length: minimum 3, maximum 22
	if (clean.length < 3) {
		clean = clean.padEnd(3, "0"); // Pad with '0' to reach minimum length
	} else if (clean.length > 22) {
		clean = clean.slice(0, 22);
	}

	return clean;
}
