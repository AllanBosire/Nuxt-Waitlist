import { consola } from "consola";

async function exec(command: string) {
	consola.info(`Executing: ${command}`);
	const { exec } = await import("child_process");
	const child = exec(command);
	child.stdout?.pipe(process.stdout);
	child.stderr?.pipe(process.stderr);
	return new Promise<void>((resolve, reject) => {
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command failed with exit code ${code}`));
			}
		});
	});
}

async function migrate() {
	try {
		await exec("pnpm drizzle-kit generate");
		await exec("pnpm drizzle-kit migrate");
		consola.success("Database migrations done");
	} catch (err) {
		consola.error("Migration error", err);
		throw err;
	}
}

export default defineNitroPlugin(async () => {
	await migrate();
});
