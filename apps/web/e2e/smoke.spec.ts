import { expect, test } from "@playwright/test";

test("unauthenticated visitors are sent to the sign-in page", async ({ page }) => {
  await page.goto("/");
  // The auth guard redirects to /login when there's no session.
  await expect(page.getByRole("heading", { name: "ACME Salary Management" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
