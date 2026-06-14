import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("paginates, sorts, filters, and searches against the seeded data", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText(/results/)).toBeVisible();

  // Paginate.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // Sort by a column (resets to page 1).
  await page.getByRole("button", { name: "Country" }).click();
  await expect(page).toHaveURL(/sort=country/);

  // Filter by country.
  await page.getByLabel("Country").selectOption("Germany");
  await expect(page).toHaveURL(/country=Germany/);

  // Search with no match → empty state with a clear action.
  await page.getByPlaceholder("Name or email…").fill("zzz-no-such-person-xyz");
  await expect(page.getByText("No employees match")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
});
