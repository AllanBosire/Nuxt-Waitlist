import { z } from "zod/v4-mini";
import { consola } from "consola";
import { joinURL } from "ufo";
import type { LoggedInUser } from "./token.get";

const schema = z.object({
	login_id: z.string().check(z.minLength(3)),
	password: z.string(),
});
export default defineEventHandler(async (event) => {
	const { login_id, password } = await readValidatedBody(event, schema.parse);
	consola.info(login_id, "is attempting to login as admin");
	const config = useRuntimeConfig();

	const response = await $fetch.raw<LoggedInUser>(
		joinURL(config.mattermost.url, "/api/v4/users/login"),
		{
			method: "POST",
			body: {
				login_id,
				password,
			},
		}
	);

	if (!response.ok) {
		throw createError({
			statusCode: 403,
		});
	}

	const mmToken = response.headers.get("Token");
	if (!mmToken) {
		throw createError({
			statusCode: 500,
			message: "Mattermost did not return a session token",
		});
	}

	const hostname = new URL(config.mattermost.url).hostname;
	setCookie(event, "MMAUTHTOKEN", mmToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		path: "/",
		domain: `${hostname.split(".").slice(-2).join(".")}`,
	});
});
