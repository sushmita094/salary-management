import { expect, test } from "@playwright/test";

test("app boots into the shell and routes to the directory", async ({ page }) => {
  await page.goto("/");
  // The index route redirects to the Directory inside the app shell.
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Directory" })).toBeVisible();
});
