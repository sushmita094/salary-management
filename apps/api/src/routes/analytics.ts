import { Router } from "express";
import { analyticsDimensionParamsSchema, distributionQuerySchema } from "@acme/shared";
import {
  getAnalyticsByDimension,
  getAnalyticsDistribution,
  getAnalyticsSummary,
} from "../controllers/analytics.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.get("/summary", getAnalyticsSummary);
router.get("/distribution", validate({ query: distributionQuerySchema }), getAnalyticsDistribution);
router.get(
  "/by/:dimension",
  validate({ params: analyticsDimensionParamsSchema }),
  getAnalyticsByDimension,
);

export { router as analyticsRouter };
