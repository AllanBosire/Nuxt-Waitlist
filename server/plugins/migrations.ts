import { consola } from "consola";
import { useDrizzle } from "@@/server/utils/drizzle";

async function migrate(database: ReturnType<typeof useDrizzle>) {
	const { exec } = await import("child_process");
	const { promisify } = await import("util");
	const execAsync = promisify(exec);
	await execAsync("pnpm drizzle-kit generate");
	await execAsync("pnpm drizzle-kit migrate");
	return database;
}

export default defineNitroPlugin(async () => {
	if (!import.meta.dev) return;

	await migrate(useDrizzle())
		.then(() => {
			consola.success("Database migrations done");
		})
		.catch((err) => {
			consola.error("Database migrations failed", err);
		});
});
