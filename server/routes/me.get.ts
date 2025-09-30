import { joinURL } from "ufo";
import { MMUser } from "../utils/mattermost";
import { isAdmin } from "../utils/user";

export default defineEventHandler(async (event) => {
	const cookie = getCookie(event, "MMAUTHTOKEN");
	if (!cookie) {
		throw createError({
			statusCode: 404,
		});
	}

	const config = useRuntimeConfig();
	const user = await event.$fetch<MMUser>(joinURL(config.mattermost.url, "/api/v4/users/me"), {
		headers: {
			Authorization: `Bearer ${cookie}`,
		},
	});

	return {
		...user,
		isAdmin: isAdmin(user),
	};
});
