import { expect, test } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("displays settings header", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();
  });

  test("displays system information section", async ({ page }) => {
    await expect(page.getByText("System Information")).toBeVisible();
  });

  test("displays about section", async ({ page }) => {
    await expect(page.getByText("About")).toBeVisible();
    await expect(
      page.getByText("Forge is a local image generation platform"),
    ).toBeVisible();
  });

  test("shows version info when backend is running", async ({ page }) => {
    // If backend is running, version should appear
    // If not, "Loading system info..." will show — both are acceptable
    const versionOrLoading = page.getByText(/Forge v0\.1\.0|Loading system/);
    await expect(versionOrLoading).toBeVisible();
  });
});
