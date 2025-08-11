import { Hono } from "hono";
import { zValidator } from "../lib/validator-wrapper";
import { withDb } from "../middleware/with-db";
import { verifyJwt } from "../middleware/auth.middleware";
import { ResponseService } from "../lib/response.service";
import { CookieService } from "../lib/cookie.service";
import { AuthService } from "../services/auth.service";
import type { Bindings } from "../types/common";
import { loginSchema, registerSchema } from "../validations/auth";
import { ERROR_MESSAGES } from "../constants/error";

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
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.AUTH.MOBILE_ALREADY_REGISTERED) {
        return ResponseService.error(c, error.message, 409);
      }
      if (error.message === ERROR_MESSAGES.AUTH.FAILED_TO_CREATE_USER) {
        return ResponseService.error(
          c,
          ERROR_MESSAGES.AUTH.FAILED_TO_CREATE_USER,
          500
        );
      }
    }

    return ResponseService.error(
      c,
      ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
      500
    );
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
    if (
      error instanceof Error &&
      error.message === ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS
    ) {
      return ResponseService.error(c, error.message, 401);
    }

    return ResponseService.error(
      c,
      ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
      500
    );
  }
});

/**
 * GET /auth/me
 */
auth.get("/me", async (c) => {
  try {
    const payload = await verifyJwt(c);

    if (!payload) {
      return ResponseService.error(c, ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401);
    }

    const db = c.get("db");
    const authService = new AuthService(db);

    const user = await authService.getCurrentUser(payload.sub);

    return ResponseService.success(c, { user });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ERROR_MESSAGES.AUTH.USER_NOT_FOUND
    ) {
      return ResponseService.error(c, error.message, 404);
    }

    return ResponseService.error(
      c,
      ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
      500
    );
  }
});

export default auth;
