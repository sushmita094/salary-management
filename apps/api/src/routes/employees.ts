import { Router } from "express";
import {
  createEmployeeSchema,
  employeeParamsSchema,
  employeeQuerySchema,
  updateEmployeeSchema,
} from "@acme/shared";
import {
  deleteEmployeeById,
  getEmployeeById,
  getEmployees,
  postEmployee,
  putEmployee,
} from "../controllers/employee.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.get("/", validate({ query: employeeQuerySchema }), getEmployees);
router.post("/", validate({ body: createEmployeeSchema }), postEmployee);
router.get("/:id", validate({ params: employeeParamsSchema }), getEmployeeById);
router.put(
  "/:id",
  validate({ params: employeeParamsSchema, body: updateEmployeeSchema }),
  putEmployee,
);
router.delete("/:id", validate({ params: employeeParamsSchema }), deleteEmployeeById);

export { router as employeesRouter };
