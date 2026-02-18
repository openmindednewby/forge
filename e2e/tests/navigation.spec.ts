import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("loads the generation page by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("textarea").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Ready to generate")).toBeVisible();
  });

  test("navigates to gallery page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Gallery").click();
    await expect(page).toHaveURL("/gallery");
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible();
  });

  test("navigates to models page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Models").click();
    await expect(page).toHaveURL("/models");
    await expect(page.getByRole("heading", { name: "Models" })).toBeVisible();
  });

  test("navigates to settings page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Settings").click();
    await expect(page).toHaveURL("/settings");
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();
  });
});
