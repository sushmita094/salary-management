import type { RequestHandler } from "express";

/**
 * Lightweight structured (JSON) request log — method, path, status, duration —
 * emitted once per request when the response finishes. No request bodies, cookies
 * or auth headers are logged, so secrets/PII stay out of the logs. Deliberately
 * dependency-free; swap for pino if log shipping is ever needed.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - start);
    console.log(
      JSON.stringify({
        level: "info",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
      }),
    );
  });
  next();
};
