import { capitalize } from "vue";

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);

	const config = useRuntimeConfig();

	return Object.entries(config.mattermost.bots).map(([id]) => ({
		id,
		label: capitalize(id),
	}));
});
