import { Router } from "express";
import { exportQuerySchema } from "@acme/shared";
import { getExport } from "../controllers/export.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.get("/", validate({ query: exportQuerySchema }), getExport);

export { router as exportRouter };
