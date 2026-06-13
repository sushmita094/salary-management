import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// jsdom lacks ResizeObserver, which Recharts' ResponsiveContainer needs. The
// charts render empty (zero width) in tests; we assert on the backing tables.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Service Worker: realistic API responses for component/feature tests.
// `bypass` lets tests that stub `fetch` directly (e.g. the client unit tests) pass through.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Unmount React trees and reset handler overrides between tests. RTL only
// auto-registers cleanup when Vitest globals are on; we keep globals off.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
