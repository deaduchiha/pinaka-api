import { DB } from "../db";

export type Role = "customer" | "user";

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

declare module "hono" {
  interface ContextVariableMap {
    db: DB;
  }
}
