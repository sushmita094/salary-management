import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Node MSW server shared across the test run (started in tests/setup.ts). */
export const server = setupServer(...handlers);
