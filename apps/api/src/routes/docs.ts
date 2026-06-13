import { Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiDocument } from "../openapi/document.js";

const document = buildOpenApiDocument();

const router: Router = Router();

/** Raw OpenAPI 3.0 spec (public). */
router.get("/openapi.json", (_req, res) => {
  res.json(document);
});

// Swagger UI ships inline scripts/styles, which the global strict CSP would block;
// relax the policy for the docs pages only (the rest of the app stays locked down).
const swaggerCsp = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
});

/** Interactive Swagger UI (public). `withCredentials` lets same-origin cookie auth work. */
router.use(
  "/docs",
  swaggerCsp,
  swaggerUi.serve,
  swaggerUi.setup(document, {
    customSiteTitle: "ACME Salary Management API",
    swaggerOptions: { withCredentials: true, persistAuthorization: true },
  }),
);

export { router as docsRouter };
