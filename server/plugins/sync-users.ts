import { consola } from "consola";
import { getAllUsers } from "../utils/user";

export default defineNitroPlugin(async () => {
	if (import.meta.dev) {
		return;
	}

	const db = useDrizzle();
	for await (const users of getAllUsers()) {
		users.forEach((user) => {
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
		});
	}

	consola.success("Synced users from main mattermost");
});
