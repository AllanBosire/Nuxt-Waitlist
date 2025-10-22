import { joinURL } from "ufo";
import { ensureAdmin } from "../../utils/user";
import { consola } from "consola";

export default defineEventHandler(async (event) => {
	const isAdmin = await ensureAdmin(event).catch(() => false);
	const config = useRuntimeConfig();
	const target = joinURL(config.public.mmUrl, event.path.replace("/mattermost", ""));
	return proxyRequest(event, target, {
		headers: {
			Authorization: isAdmin ? `Bearer ${config.mattermost.token}` : undefined,
		},
		onResponse(_, response) {
			consola.info(`[GET] ${target} - {${response.status}}`);
		},
	});
});
