import type { MiddlewareHandler } from "hono";
import { DB, getDB } from "../db";
import { Bindings } from "../types/common";

export const withDb: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { db: DB };
}> = async (c, next) => {
  if (!c.get("db")) {
    c.set("db", getDB(c.env.DB));
  }
  await next();
};
