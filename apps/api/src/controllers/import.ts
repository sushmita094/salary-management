import type { Request, Response } from "express";
import { runImport } from "../services/import.service.js";
import { ValidationError } from "../utils/errors.js";

/**
 * `POST /import` — multipart upload (field `file`). Multer has already put the
 * file buffer on `req.file`; the service does the parsing/validation and returns
 * the per-row report.
 */
export async function postImport(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ValidationError("No file uploaded (expected a multipart field named 'file')");
  }
  const result = await runImport(req.file.buffer);
  res.json(result);
}
