import { expect, test } from "@playwright/test";

test.describe("Models Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/models");
  });

  test("displays models header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Models" })).toBeVisible();
  });

  test("displays available models from backend", async ({ page }) => {
    // The demo backend provides a "Demo (Procedural)" model
    // When real models are installed, they also appear here
    await expect(
      page.getByRole("heading", { name: "Models" }),
    ).toBeVisible();

    // Either shows the demo model or an empty state
    const hasModels = await page.getByText("Demo (Procedural)").isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No models found").isVisible().catch(() => false);
    expect(hasModels || hasEmpty).toBe(true);
  });
});
