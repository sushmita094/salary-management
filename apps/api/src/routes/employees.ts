import { Router } from "express";
import { employeeQuerySchema } from "@acme/shared";
import { getEmployees } from "../controllers/employee.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.get("/", validate({ query: employeeQuerySchema }), getEmployees);

export { router as employeesRouter };
