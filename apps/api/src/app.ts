import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/require-auth.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { employeesRouter } from "./routes/employees.js";
import { exportRouter } from "./routes/export.js";
import { healthRouter } from "./routes/health.js";
import { importRouter } from "./routes/import.js";

/** Builds the Express app without binding a port, so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Public: liveness and sign-in. (The OpenAPI docs routes, added in Phase 9, stay public too.)
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);

  // Everything touching employee data sits behind the auth gate.
  app.use("/employees", requireAuth, employeesRouter);
  app.use("/analytics", requireAuth, analyticsRouter);
  app.use("/import", requireAuth, importRouter);
  app.use("/export", requireAuth, exportRouter);

  app.use(errorHandler);

  return app;
}
