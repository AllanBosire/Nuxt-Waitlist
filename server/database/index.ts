import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
import { getCredentials } from "@@/drizzle.config";

const connection = postgres(getCredentials());
const db = drizzle(connection, {
	schema: schema,
});
export default db;
