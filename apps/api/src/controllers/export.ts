import type { Request, Response } from "express";
import type { ExportQuery } from "@acme/shared";
import { buildExport } from "../services/export.service.js";

/**
 * `GET /export` — download the filtered directory as CSV/XLSX. The query (filters
 * + sort + format) was parsed by the `validate` middleware onto `res.locals`.
 */
export async function getExport(_req: Request, res: Response): Promise<void> {
  const query = res.locals.query as ExportQuery;
  const file = await buildExport(query);

  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.send(file.body);
}
