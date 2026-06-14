import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("shows the per-currency summary and reflects dimension/currency changes", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: "Analytics" }).click();

  // Summary headcount for the full seed.
  await expect(page.getByText("Total headcount")).toBeVisible();
  await expect(page.getByText("10,000")).toBeVisible();

  // Switch the dimension and currency; the comparison heading reflects both.
  await page.getByLabel("Dimension").selectOption("country");
  await page.getByLabel("Currency").selectOption("USD");
  await expect(page.getByRole("heading", { name: /by country · USD/ })).toBeVisible();
});
