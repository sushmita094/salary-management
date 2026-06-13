import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount React trees between tests. RTL only auto-registers this when Vitest
// globals are on; we keep globals off, so wire cleanup explicitly.
afterEach(() => {
  cleanup();
});
