import { expect, test } from "@playwright/test";
import { fillLogin, signIn } from "./helpers";

test("guards a deep link and returns to it after sign in", async ({ page }) => {
  // Deep-link to a protected page while logged out.
  await page.goto("/analytics");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await fillLogin(page);

  // Lands on the originally requested page, not just the home route.
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
});

test("signs out back to the login page", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
