import { Hono } from "hono";
import { withDb } from "./middleware/with-db";
import auth from "./routes/auth";

const app = new Hono();

app.use("*", withDb);

app.route("/auth", auth);

app.get("/", async (c) => {
  return c.json({ message: "Pinaka API is running" });
});

export default app;
