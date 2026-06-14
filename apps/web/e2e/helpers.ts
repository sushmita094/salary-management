import { expect, type Page } from "@playwright/test";

/** The seeded HR-Manager credentials (see playwright.config.ts API_ENV). */
export const CREDS = { email: "hr@acme.example", password: "e2e-password-123" };

/** Fill and submit the sign-in form. */
export async function fillLogin(page: Page) {
  await page.getByLabel("Email").fill(CREDS.email);
  await page.getByLabel("Password").fill(CREDS.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Sign in from a clean session and land on the Directory. */
export async function signIn(page: Page) {
  await page.goto("/login");
  await fillLogin(page);
  await expect(page.getByRole("heading", { name: "Directory" })).toBeVisible();
}
