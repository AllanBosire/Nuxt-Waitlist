import { consola } from "consola";
import { joinURL } from "ufo";

async function* getAllUsers(page: number = 0) {
	const config = useRuntimeConfig();
	while (true) {
		const users = await $fetch<MMUser[]>(joinURL(config.public.mmUrl, "/api/v4/users"), {
			headers: {
				Authorization: `Bearer ${config.mattermost.token}`,
			},
			query: {
				page,
				active: true,
			},
		}).catch((e) => {
			consola.fatal(e);
			return undefined;
		});

		if (!users || !users.length) {
			break;
		}

		for (const user of users) {
			yield user;
		}
		page = page + 1;
	}
}

export default defineNitroPlugin(async () => {
	if (import.meta.dev) {
		return;
	}
	
	const db = useDrizzle();
	for await (const user of getAllUsers()) {
		db.insert(tables.waitlist)
			.values({
				email: user.email,
				referrer: "SYSTEM",
				createdAt: new Date(user.create_at),
			})
			.onConflictDoNothing()
			.execute()
			.catch((e) => {
				consola.fatal(e);
			});
	}

	consola.success("Synced users from main mattermost");
});
