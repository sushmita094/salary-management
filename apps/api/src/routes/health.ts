import { Router } from "express";
import { getHealth } from "../controllers/health.js";

const router: Router = Router();

router.get("/", getHealth);

export { router as healthRouter };
