// src/middleware/validator-wrapper.ts
import { z, ZodError } from "zod";
import type { ValidationTargets } from "hono";
import { zValidator as baseZ } from "@hono/zod-validator";

type Options = {
  status?: number; // default 422
  includeIssues?: boolean; // default true
};

function toFields(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.issues) {
    const key = i.path && i.path.length ? i.path.map(String).join(".") : "_";
    (out[key] ||= []).push(i.message);
  }
  return out;
}

/**
 * Usage:
 *   app.post("/signup", zValidator("json", schema), (c) => {
 *     const body = c.req.valid("json"); // fully typed
 *   });
 */
export const zValidator = <
  T extends z.ZodTypeAny,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T,
  options?: Options
) =>
  baseZ(target, schema, async (result, c) => {
    if (result.success) return;

    const fields = toFields(result.error as unknown as ZodError);

    const payload = {
      error: { ...fields },
    };

    return c.json(payload, (options?.status ?? 422) as any);
  });
