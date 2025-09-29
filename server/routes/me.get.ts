import { joinURL } from "ufo";
import { MMUser } from "../utils/mattermost";

export default defineCachedEventHandler(
	async (event) => {
		const cookie = getCookie(event, "MMAUTHTOKEN");
		if (!cookie) {
			throw createError({
				statusCode: 404,
			});
		}

		const config = useRuntimeConfig();
		return event.$fetch<MMUser>(joinURL(config.mattermost.url, "/api/v4/users/me"), {
			headers: {
				Authorization: `Bearer ${cookie}`,
			},
		});
	},
	{
		getKey(event) {
			return getCookie(event, "MMAUTHTOKEN") || "UNKNOWN";
		},
		maxAge: 60 * 10,
	}
);
