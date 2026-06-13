import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { requireAuth } from "./middleware/require-auth.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { docsRouter } from "./routes/docs.js";
import { employeesRouter } from "./routes/employees.js";
import { exportRouter } from "./routes/export.js";
import { healthRouter } from "./routes/health.js";
import { importRouter } from "./routes/import.js";

/** Builds the Express app without binding a port, so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  // Security & robustness: hardened headers, scoped CORS (credentials for the
  // auth cookie), and a JSON body-size limit.
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(cookieParser());
  if (!config.isTest) app.use(requestLogger);

  // Public: liveness, sign-in, and the OpenAPI docs.
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use(docsRouter);

  // Everything touching employee data sits behind the auth gate.
  app.use("/employees", requireAuth, employeesRouter);
  app.use("/analytics", requireAuth, analyticsRouter);
  app.use("/import", requireAuth, importRouter);
  app.use("/export", requireAuth, exportRouter);

  app.use(errorHandler);

  return app;
}
