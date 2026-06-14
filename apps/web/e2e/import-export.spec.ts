import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const HEADER = "name,email,country,department,jobTitle,level,salaryAmount,salaryCurrency";

test("imports a spreadsheet and shows the per-row report", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: "Import / Export" }).click();

  const email = `e2e-import-${Date.now()}@acme.example`;
  const csv = [
    HEADER,
    `Imported Person,${email},Germany,Engineering,Software Engineer,Senior,90000,EUR`,
    "Bad Row,not-an-email,Germany,Engineering,Software Engineer,Senior,-5,Dollars",
  ].join("\n");

  await page.getByLabel("Spreadsheet file").setInputFiles({
    name: "employees.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: "Upload" }).click();

  // Summary + the skipped (bad) row are reported.
  await expect(page.getByText("Inserted")).toBeVisible();
  await expect(page.getByText("Failed")).toBeVisible();
  await expect(page.getByText(/not-an-email|Invalid email/)).toBeVisible();
});

test("exports the directory as a downloadable file", async ({ page }) => {
  await signIn(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/employees-.*\.csv/);
});
