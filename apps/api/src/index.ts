import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { prisma } from "./db/client.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

/** Close the HTTP server and the database connection cleanly on shutdown signals. */
function shutdown(signal: string): void {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
