import { Hono } from "hono";
import { withDb } from "./middleware/with-db";

// type Bindings = {
//   DB: D1Database;
// };

const app = new Hono();

app.use("*", withDb);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
