import { expect, test } from "@playwright/test";

test.describe("Gallery Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gallery");
  });

  test("displays gallery header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible();
  });

  test("displays favorites filter button", async ({ page }) => {
    await expect(page.getByText("Favorites")).toBeVisible();
  });

  test("displays image count", async ({ page }) => {
    // Should show "N images" text (count depends on existing data)
    await expect(page.getByText(/\d+ images?/)).toBeVisible();
  });

  test("displays gallery content", async ({ page }) => {
    // Either shows images or the empty state
    const hasImages = await page.getByText(/\d+ images/).isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No images yet").isVisible().catch(() => false);
    expect(hasImages || hasEmpty).toBe(true);
  });

  test("favorites filter toggles on click", async ({ page }) => {
    const favoritesBtn = page.getByText("Favorites");
    await favoritesBtn.click();
    await expect(favoritesBtn).toHaveClass(/forge-500/);
    await favoritesBtn.click();
    await expect(favoritesBtn).not.toHaveClass(/forge-500/);
  });
});
