export default defineEventHandler((event) => {
	const config = useRuntimeConfig();
	const hostname = import.meta.dev ? undefined : new URL(config.mattermost.url).hostname;
	deleteCookie(event, "MMAUTHTOKEN", {
		domain: hostname ? `${hostname.split(".").slice(-2).join(".")}` : undefined,
	});

	return "OK";
});
