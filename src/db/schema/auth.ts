import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  // uuid for primary key
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // auth via mobile and password
  mobile: text("mobile").notNull().unique(),
  password: text("password"),

  // name of user
  name: text("name").notNull(),

  // role of user
  role: text("role", { enum: ["customer", "user"] })
    .notNull()
    .default("user"),

  // created at
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
