import * as schema from "./schema"; // <- now imports all tables
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";

export const getDB = (dbBinding: D1Database) => {
  return drizzle<typeof schema>(dbBinding, { schema });
};

export type DB = DrizzleD1Database<typeof schema>;
