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
	const { result: user, error } = await execute(
		event.$fetch<MMUser>,
		joinURL(config.mattermost.url, "/api/v4/users/me"),
		{
			headers: {
				Authorization: `Bearer ${cookie}`,
			},
		}
	);

	if (error) {
		throw createError({
			message: "Unable to validate with mattermost server",
			cause: error,
		});
	}

	return {
		...user,
		isAdmin: isAdmin(user),
	};
});
