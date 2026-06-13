import type { z } from "zod";
import type { authUserSchema, loginResponseSchema, loginSchema } from "../schemas/auth.js";

/** `POST /auth/login` request body. */
export type LoginInput = z.infer<typeof loginSchema>;

/** Public user view returned to the client / carried in the token claims. */
export type AuthUser = z.infer<typeof authUserSchema>;

/** `POST /auth/login` response. */
export type LoginResponse = z.infer<typeof loginResponseSchema>;
