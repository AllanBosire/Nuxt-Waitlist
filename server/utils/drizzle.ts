import db from "../database/index";
export { sql, eq, and, or } from "drizzle-orm";

import * as schema from "../database/schema";

export const tables = schema;

export function useDrizzle() {
	return db;
}

export type Waitlist = typeof schema.waitlist.$inferSelect;
