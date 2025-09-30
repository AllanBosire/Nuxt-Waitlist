import { consola } from "consola";
import type { H3Event } from "h3";
import { joinURL } from "ufo";

export async function deleteUser(email: string) {
	const user = await useDrizzle()
		.delete(tables.waitlist)
		.where(eq(tables.waitlist.email, email))
		.returning()
		.execute()
		.catch(consola.fatal);

	user?.forEach((user) => {
		sendMail({
			to: user.email,
			subject: "Account Deletion",
			text: "Your account has been deleted successfully",
		});
	});
}

const getMMUserFromCookie = defineCachedFunction(
	(cookie: string) => {
		const config = useRuntimeConfig();
		return $fetch<MMUser | undefined>(joinURL(config.mattermost.url, "/api/v4/users/me"), {
			headers: {
				Authorization: `Bearer ${cookie}`,
			},
		});
	},
	{
		maxAge: 60,
	}
);

export function isAdmin(user: { email: string }) {
	const config = useRuntimeConfig();

	const admins = config.mattermost.admins.split(",");
	if (!admins.includes(user.email)) {
		return false;
	}

	return true;
}

/**
 * @throws When user is not admin
 */
export async function ensureAdmin(event: H3Event) {
	const cookie = getCookie(event, "MMAUTHTOKEN");
	if (!cookie) {
		throw createError({
			status: 404,
			message: "No MMAUTHTOKEN cookie",
		});
	}

	const user = await getMMUserFromCookie(cookie);
	if (!user) {
		throw createError({
			statusCode: 404,
		});
	}

	if (!isAdmin(user)) {
		throw createError({ statusCode: 401 });
	}
}
