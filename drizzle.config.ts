import { defineConfig } from "drizzle-kit";
import { getCredentials } from "./server/database";

const credentials = getCredentials();

console.log("Drizzle config - using database:", {
	host: credentials.host,
	database: credentials.database,
	user: credentials.username,
	password: credentials.password ? "********" : "(empty)",
	port: credentials.port,
	dialect: credentials.dialect,
});
export default defineConfig({
	out: "./server/database/migrations",
	dialect: "postgresql",
	schema: "./server/database/schema.ts",
	verbose: true,
	dbCredentials: {
		url: `${credentials.dialect}://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`,
	},
});
