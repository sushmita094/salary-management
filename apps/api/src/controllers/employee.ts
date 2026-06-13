import type { Request, Response } from "express";
import type { CreateEmployee, EmployeeParams, EmployeeQuery, UpdateEmployee } from "@acme/shared";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employee.service.js";

/**
 * Controllers for the employee directory and CRUD. Inputs were already parsed by
 * the `validate` middleware and stashed on `res.locals`, so each handler hands
 * typed data to the service and shapes the HTTP response. Async rejections (incl.
 * the typed domain errors the service throws) propagate to the central error
 * handler (Express 5).
 */

/** `GET /employees` — paginated, searchable, filterable, sortable directory. */
export async function getEmployees(_req: Request, res: Response): Promise<void> {
  const query = res.locals.query as EmployeeQuery;
  const result = await listEmployees(query);
  res.json(result);
}

/** `GET /employees/:id` — a single employee (404 if missing). */
export async function getEmployeeById(_req: Request, res: Response): Promise<void> {
  const { id } = res.locals.params as EmployeeParams;
  const employee = await getEmployee(id);
  res.json(employee);
}

/** `POST /employees` — create (201; 409 on duplicate email). */
export async function postEmployee(_req: Request, res: Response): Promise<void> {
  const data = res.locals.body as CreateEmployee;
  const created = await createEmployee(data);
  res.status(201).json(created);
}

/** `PUT /employees/:id` — partial update (200; 404 if missing; 409 on email collision). */
export async function putEmployee(_req: Request, res: Response): Promise<void> {
  const { id } = res.locals.params as EmployeeParams;
  const data = res.locals.body as UpdateEmployee;
  const updated = await updateEmployee(id, data);
  res.json(updated);
}

/** `DELETE /employees/:id` — remove (204; 404 if missing). */
export async function deleteEmployeeById(_req: Request, res: Response): Promise<void> {
  const { id } = res.locals.params as EmployeeParams;
  await deleteEmployee(id);
  res.status(204).send();
}
