import express, { type Express } from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { employeesRouter } from "./routes/employees.js";
import { healthRouter } from "./routes/health.js";

/** Builds the Express app without binding a port, so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/employees", employeesRouter);

  app.use(errorHandler);

  return app;
}
