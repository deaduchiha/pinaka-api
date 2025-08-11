import { Hono } from "hono";
import { zValidator } from "../lib/validator-wrapper";
import { withDb } from "../middleware/with-db";
import type { Bindings } from "../types/common";

import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { loginSchema, registerSchema } from "../validations/auth";
import { SignJWT, jwtVerify } from "jose";
import { hashPassword, verifyPassword } from "../lib/password";
const auth = new Hono<{ Bindings: Bindings }>();

auth.use("*", withDb);

// JWT signing function
async function signJwt(
  payload: { sub: string; role: string; mobile: string },
  secret: string,
  days: number
): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(new TextEncoder().encode(secret));
  return jwt;
}

// JWT verification middleware
async function verifyJwt(c: any) {
  let token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    // Try to get token from cookie as fallback
    try {
      token = c.req.cookie("token");
    } catch {
      // Cookie parsing might fail, continue without it
    }
  }

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET)
    );
    return payload;
  } catch {
    return null;
  }
}

/**
 * POST /auth/signup
 */
auth.post("/signup", zValidator("json", registerSchema), async (c) => {
  const db = c.get("db");
  const { mobile, name, password } = c.req.valid("json");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.mobile, mobile))
    .get();

  if (existing) {
    return c.json({ error: "Mobile already registered." }, 409);
  }

  const passwordHash = await hashPassword(password, 10);

  const result = await db
    .insert(users)
    .values({
      mobile,
      name,
      password: passwordHash,
      createdAt: new Date(),
    })
    .returning()
    .get();

  if (!result) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  const token = await signJwt(
    { sub: result.id, role: result.role, mobile: result.mobile },
    c.env.JWT_SECRET,
    30
  );

  c.header(
    "Set-Cookie",
    `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${
      30 * 24 * 60 * 60
    }`
  );

  return c.json({
    user: {
      id: result.id,
      mobile: result.mobile,
      name: result.name,
      role: result.role,
    },
    token,
  });
});

/**
 * POST /auth/login
 */
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const db = c.get("db");
  const { mobile, password } = c.req.valid("json");

  const row = await db
    .select({
      id: users.id,
      mobile: users.mobile,
      name: users.name,
      role: users.role,
      password: users.password,
    })
    .from(users)
    .where(eq(users.mobile, mobile))
    .get();

  if (!row) return c.json({ error: "Invalid credentials." }, 401);

  const ok = await verifyPassword(password, row.password ?? "");
  if (!ok) return c.json({ error: "Invalid credentials." }, 401);

  const token = await signJwt(
    {
      sub: row.id,
      role: row.role as "user" | "customer",
      mobile: row.mobile,
    },
    c.env.JWT_SECRET,
    30
  );

  c.header(
    "Set-Cookie",
    `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${
      30 * 24 * 60 * 60
    }`
  );

  return c.json({
    user: { id: row.id, mobile: row.mobile, name: row.name, role: row.role },
    token,
  });
});

/**
 * GET /auth/me
 */
auth.get("/me", async (c) => {
  const payload = await verifyJwt(c);

  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = c.get("db");
  const user = await db
    .select({
      id: users.id,
      mobile: users.mobile,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.sub as string))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    user: {
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

export default auth;
