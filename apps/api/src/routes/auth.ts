import { Router } from "express";
import { loginSchema } from "@acme/shared";
import { getMe, postLogin, postLogout } from "../controllers/auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.post("/login", validate({ body: loginSchema }), postLogin);
router.post("/logout", requireAuth, postLogout);
router.get("/me", requireAuth, getMe);

export { router as authRouter };
