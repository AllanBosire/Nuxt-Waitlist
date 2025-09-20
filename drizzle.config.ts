import { defineConfig } from "drizzle-kit";

export type DBCredentials = {
	database: string;
	password: string;
	username: string;
	host: string;
	port: number;
	dialect: "postgresql";
};

function validateCredentials(credentials: Record<string, unknown>): DBCredentials {
	const errors: string[] = [];

	const requiredString = (key: string, error: string): string => {
		const value = credentials[key];
		if (typeof value !== "string" || value.trim() === "") {
			errors.push(error);
			return "";
		}
		return value;
	};

	const database = requiredString("database", "env: DB_NAME required");
	const host = requiredString("host", "env: DB_HOST required");
	const password = requiredString("password", "env: DB_PASSWORD required");
	const username = requiredString("username", "env: DB_USER required");

	// Port can be string or number
	let rawPort = credentials["port"];
	let port: number | null = null;

	if (typeof rawPort === "string" && rawPort.trim() !== "") {
		const parsed = parseInt(rawPort, 10);
		if (!isNaN(parsed)) port = parsed;
	} else if (typeof rawPort === "number") {
		port = rawPort;
	} else {
		errors.push("env: DB_PORT required");
	}

	// Default dialect to "postgresql"
	let dialect =
		typeof credentials["dialect"] === "string" ? credentials["dialect"] : "postgresql";

	// Throw error if any validation failed
	if (errors.length > 0) {
		throw new Error(errors.join(", "));
	}

	return {
		database,
		host,
		password,
		port: port as number,
		username,
		dialect: dialect as "postgresql",
	};
}

export function getCredentials(): DBCredentials {
	if (process.env.DATABASE_URL) {
		const credentials = new URL(process.env.DATABASE_URL);
		return {
			host: credentials.host.replace(/:\d+$/, "") || "localhost",
			password: credentials.password,
			port: parseInt(credentials.port),
			database: credentials.pathname.replace("/", ""),
			username: credentials.username,
			dialect: "postgresql",
		};
	}

	const credentials: Partial<DBCredentials> = {
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		password: process.env.DB_PASSWORD,
		port:
			typeof process.env.DB_PORT === "string"
				? parseInt(process.env.DB_PORT)
				: process.env.DB_PORT,
		username: process.env.DB_USER,
		dialect: "postgresql",
	};

	return validateCredentials(credentials);
}

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
	dialect: credentials.dialect,
	schema: "./server/database/schema.ts",
	verbose: true,
	dbCredentials: {
		url: `${credentials.dialect}://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`,
	},
});
