import { z } from "zod";
import { joinURL } from "ufo";
import { consola } from "consola";

const schema = z.object({
	username: z.string(),
});

async function checkUsername(term: string) {
	const config = useRuntimeConfig();
	const results = await $fetch<any[]>(
		joinURL(config.public.mmUrl, `/api/v4/users/username/${term}`),
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${config.mattermost.token}`,
			},
		}
	).catch((e) => {
		if (e?.response?.status === 404) {
			return undefined;
		}

		consola.fatal(e);
	});

	if (!results) {
		return false;
	}

	if (Array.isArray(results)) {
		return results.length > 0;
	}

	if (typeof results === "object") {
		return Object.keys(results).length > 0;
	}

	return !!results;
}

export default defineEventHandler(async (event) => {
	const { username } = await getValidatedQuery(event, schema.parseAsync);
	const exists = await checkUsername(username);
	return {
		exists,
	};
});
