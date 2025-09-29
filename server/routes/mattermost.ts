import { joinURL } from "ufo";

const getUser = defineCachedFunction(
	(cookie: string) => {
		const config = useRuntimeConfig();
		return $fetch<MMUser>(joinURL(config.mattermost.url, "/api/v4/users/me"), {
			headers: {
				Authorization: `Bearer ${cookie}`,
			},
		});
	},
	{
		maxAge: 60,
	}
);

export default defineEventHandler(async (event) => {
	const cookie = getCookie(event, "MMAUTHTOKEN");
	if (!cookie) {
		throw createError({
			statusCode: 404,
		});
	}

	const user = await getUser(cookie);
	const config = useRuntimeConfig();

	const admins = config.mattermost.admins.split(",");
	if (!admins.includes(user.email)) {
		throw createError({ statusCode: 401 });
	}

	const target = joinURL(config.mattermost.url, event.path.replace("/mattermost", ""));
	return proxyRequest(event, target);
});
