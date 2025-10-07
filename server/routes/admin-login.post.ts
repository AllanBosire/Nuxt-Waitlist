import { z } from "zod/v4-mini";
import { consola } from "consola";
import { joinURL } from "ufo";
import type { LoggedInUser } from "./token.get";

const schema = z.object({
	username: z.string().check(z.minLength(3)),
	password: z.string(),
});
export default defineEventHandler(async (event) => {
	const { username, password } = await readValidatedBody(event, schema.parse);
	consola.info(username, "is attempting to login as admin");
	const config = useRuntimeConfig();

	const response = await $fetch
		.raw<LoggedInUser>(joinURL(config.public.mmUrl, "/api/v4/users/login"), {
			method: "POST",
			body: {
				login_id: username,
				password,
			},
		})
		.catch((e) => {
			consola.fatal(e);
			return undefined;
		});

	if (!response) {
		throw createError({
			message: "Invalid User or Password",
			status: 401,
			data: {
				username,
				password,
			},
		});
	}

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

	const hostname = import.meta.dev ? undefined : new URL(config.public.mmUrl).hostname;
	setCookie(event, "MMAUTHTOKEN", mmToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		path: "/",
		domain: hostname ? `${hostname.split(".").slice(-2).join(".")}` : undefined,
	});
});
