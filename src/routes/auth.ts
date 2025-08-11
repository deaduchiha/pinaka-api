import { Hono } from "hono";
import { zValidator } from "../lib/validator-wrapper";
import { withDb } from "../middleware/with-db";
import { verifyJwt } from "../middleware/auth.middleware";
import { ResponseService } from "../lib/response.service";
import { CookieService } from "../lib/cookie.service";
import { AuthService } from "../services/auth.service";
import type { Bindings } from "../types/common";
import { loginSchema, registerSchema } from "../validations/auth";

const auth = new Hono<{ Bindings: Bindings }>();

auth.use("*", withDb);

/**
 * POST /auth/signup
 */
auth.post("/signup", zValidator("json", registerSchema), async (c) => {
  try {
    const db = c.get("db");
    const authService = new AuthService(db);
    const { mobile, name, password } = c.req.valid("json");

    const result = await authService.register(
      { mobile, name, password },
      c.env.JWT_SECRET
    );

    // Set cookie
    CookieService.setAuthCookie(c, result.token);

    return ResponseService.success(c, result, 201);
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof Error) {
      if (error.message === "Mobile already registered.") {
        return ResponseService.error(c, error.message, 409);
      }
      if (error.message === "Failed to create user") {
        return ResponseService.error(c, error.message, 500);
      }
    }

    return ResponseService.error(c, "Internal server error", 500);
  }
});

/**
 * POST /auth/login
 */
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const db = c.get("db");
    const authService = new AuthService(db);
    const { mobile, password } = c.req.valid("json");

    const result = await authService.login(
      { mobile, password },
      c.env.JWT_SECRET
    );

    // Set cookie
    CookieService.setAuthCookie(c, result.token);

    return ResponseService.success(c, result);
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error && error.message === "Invalid credentials.") {
      return ResponseService.error(c, error.message, 401);
    }

    return ResponseService.error(c, "Internal server error", 500);
  }
});

/**
 * GET /auth/me
 */
auth.get("/me", async (c) => {
  try {
    const payload = await verifyJwt(c);

    if (!payload) {
      return ResponseService.error(c, "Unauthorized", 401);
    }

    const db = c.get("db");
    const authService = new AuthService(db);

    const user = await authService.getCurrentUser(payload.sub);

    return ResponseService.success(c, { user });
  } catch (error) {
    console.error("Me endpoint error:", error);

    if (error instanceof Error && error.message === "User not found") {
      return ResponseService.error(c, error.message, 404);
    }

    return ResponseService.error(c, "Internal server error", 500);
  }
});

export default auth;
