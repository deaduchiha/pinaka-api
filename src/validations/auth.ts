import { z } from "zod";

export const loginSchema = z.object({
  mobile: z.string().min(11).max(11),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(3),
  mobile: z.string().min(11).max(11),
  password: z.string().min(8),
});
