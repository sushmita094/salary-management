import { z } from "zod";

/**
 * Auth contracts (requirements §5.5). A single HR-Manager signs in; there are no
 * roles. The password is never returned — only the public user view is.
 */

/** `POST /auth/login` body. */
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/** The safe, public view of the signed-in user (never includes the hash). */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

/**
 * `POST /auth/login` response. The JWT is set as an httpOnly cookie *and* echoed
 * here so a tester can paste it into Swagger's Authorize (the cookie is
 * unreadable from JS).
 */
export const loginResponseSchema = z.object({
  user: authUserSchema,
  token: z.string(),
});
