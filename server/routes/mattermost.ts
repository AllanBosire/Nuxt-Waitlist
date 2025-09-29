import { joinURL } from "ufo";
import { ensureAdmin } from "../utils/user";

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);
	const config = useRuntimeConfig();
	const target = joinURL(config.mattermost.url, event.path.replace("/mattermost", ""));
	return proxyRequest(event, target, {
		headers: {
			Authorization: `Bearer ${config.mattermost.token}`,
		},
	});
});
