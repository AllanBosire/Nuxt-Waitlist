import { defineConfig } from "drizzle-kit";
import { getCredentials } from "./server/database";
import { stringifyParsedURL } from "ufo";

const credentials = getCredentials();

export default defineConfig({
	out: "./server/database/migrations",
	dialect: "postgresql",
	schema: "./server/database/schema.ts",
	verbose: true,
	dbCredentials: {
		url: stringifyParsedURL({
			host: credentials.host,
			pathname: credentials.database,
			protocol: "postgresql://",
			auth: `${credentials.username}:${credentials.password}`,
		}),
	},
});
