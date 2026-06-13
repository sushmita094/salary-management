import type { Request, Response } from "express";
import type { EmployeeQuery } from "@acme/shared";
import { listEmployees } from "../services/employee.service.js";

/**
 * `GET /employees` — paginated, searchable, filterable, sortable directory.
 * The query was already parsed by the `validate` middleware and stashed on
 * `res.locals`, so the controller just hands typed input to the service.
 * Async rejections propagate to the central error handler (Express 5).
 */
export async function getEmployees(_req: Request, res: Response): Promise<void> {
  const query = res.locals.query as EmployeeQuery;
  const result = await listEmployees(query);
  res.json(result);
}
