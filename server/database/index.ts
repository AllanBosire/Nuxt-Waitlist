import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
import { z } from "zod/v4-mini";

export type DBCredentials = {
	database: string;
	password: string;
	username: string;
	host: string;
	port: number;
};

export function getCredentials(): DBCredentials {
	if (process.env.DATABASE_URL) {
		const credentials = new URL(process.env.DATABASE_URL);
		return {
			host: credentials.host || "localhost",
			password: credentials.password,
			port: parseInt(credentials.port),
			database: credentials.pathname.replace("/", ""),
			username: credentials.username,
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
	};

	const schema = z.object({
		database: z.string({
			error: "env: DB_NAME required",
		}),
		host: z.string({ error: "env: DB_HOST required" }),
		password: z.string({ error: "env: DB_PASSWORD required" }),
		port: z
			.union([z.string(), z.number()], { error: "env: DB_PORT required" })
			.check(z.refine((n) => (typeof n === "string" ? parseInt(n) : n))),
		username: z.string({ error: "env:DB_USER required" }),
	});

	return schema.parse(credentials) as DBCredentials;
}

const connection = postgres(getCredentials());
const db = drizzle(connection, {
	schema: schema,
});
export default db;
