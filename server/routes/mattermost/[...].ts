import { joinURL } from "ufo";
import { ensureAdmin } from "../../utils/user";
import { consola } from "consola";

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);
	const config = useRuntimeConfig();
	const target = joinURL(config.mattermost.url, event.path.replace("/mattermost", ""));
	return proxyRequest(event, target, {
		headers: {
			Authorization: `Bearer ${config.mattermost.token}`,
		},
		onResponse(_, response) {
			consola.info(`[GET] ${target} - {${response.status}}`);
		},
	});
});
