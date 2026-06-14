import { expect, test } from "@playwright/test";

// Narrow (phone-width) viewport.
test.use({ viewport: { width: 375, height: 812 } });

test("renders without horizontal overflow on a narrow viewport", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
});
