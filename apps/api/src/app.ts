import express, { type Express } from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { analyticsRouter } from "./routes/analytics.js";
import { employeesRouter } from "./routes/employees.js";
import { exportRouter } from "./routes/export.js";
import { healthRouter } from "./routes/health.js";
import { importRouter } from "./routes/import.js";

/** Builds the Express app without binding a port, so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/employees", employeesRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/import", importRouter);
  app.use("/export", exportRouter);

  app.use(errorHandler);

  return app;
}
