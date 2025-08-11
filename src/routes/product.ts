import { Hono } from "hono";
import { Bindings } from "../types/common";
import { withDb } from "../middleware/with-db";

const products = new Hono<{ Bindings: Bindings }>();

products.use("*", withDb);
