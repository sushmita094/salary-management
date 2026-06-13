import { Router } from "express";
import multer from "multer";
import { postImport } from "../controllers/import.js";

// Buffer the upload in memory (10 MB cap) — files in scope are small (~10k rows).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router: Router = Router();

router.post("/", upload.single("file"), postImport);

export { router as importRouter };
