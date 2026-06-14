import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("creates, edits, and deletes an employee through the UI", async ({ page }) => {
  await signIn(page);
  const email = `e2e-${Date.now()}@acme.example`;

  // Create.
  await page.getByRole("link", { name: "New employee" }).click();
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Country").selectOption("Germany");
  await page.getByLabel("Department").selectOption("Engineering");
  await page.getByLabel("Job title").fill("Software Engineer");
  await page.getByLabel("Level").selectOption("Senior");
  await page.getByLabel("Salary amount").fill("150000");
  await page.getByLabel("Currency (ISO)").fill("EUR");
  await page.getByRole("button", { name: "Create" }).click();

  // Lands on the detail page for the new employee.
  await expect(page.getByRole("heading", { name: "E2E Tester" })).toBeVisible();

  // Edit the salary.
  await page.getByRole("link", { name: "Edit" }).click();
  const salary = page.getByLabel("Salary amount");
  await salary.fill("175000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("€175,000")).toBeVisible();

  // Delete with confirmation.
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Directory" })).toBeVisible();
});
