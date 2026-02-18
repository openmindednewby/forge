import { expect, test } from "@playwright/test";

test.describe("Generation Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays prompt input fields", async ({ page }) => {
    const promptTextarea = page.locator("textarea").first();
    await expect(promptTextarea).toBeVisible();
    await expect(promptTextarea).toHaveAttribute(
      "placeholder",
      "A beautiful landscape...",
    );

    const negativeTextarea = page.locator("textarea").nth(1);
    await expect(negativeTextarea).toBeVisible();
    await expect(negativeTextarea).toHaveAttribute(
      "placeholder",
      "blurry, low quality...",
    );
  });

  test("displays model selector", async ({ page }) => {
    const modelSelect = page.locator("select").first();
    await expect(modelSelect).toBeVisible();
    await expect(modelSelect).toContainText("Auto-detect");
  });

  test("displays size selection buttons", async ({ page }) => {
    await expect(page.getByText("512x512")).toBeVisible();
    await expect(page.getByText("768x768")).toBeVisible();
    await expect(page.getByText("1024x1024")).toBeVisible();
  });

  test("can select a size", async ({ page }) => {
    const sizeButton = page.getByText("768x768");
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/forge-500/);
  });

  test("displays steps slider", async ({ page }) => {
    await expect(page.getByText("Steps")).toBeVisible();
    await expect(page.getByText("30")).toBeVisible();
  });

  test("displays CFG scale slider", async ({ page }) => {
    await expect(page.getByText("CFG Scale")).toBeVisible();
    await expect(page.locator("#cfg-scale")).toBeVisible();
    const value = await page.locator("#cfg-scale").inputValue();
    expect(value).toBe("7");
  });

  test("displays seed input with random button", async ({ page }) => {
    await expect(page.getByPlaceholder("-1 for random")).toBeVisible();
  });

  test("displays sampler dropdown", async ({ page }) => {
    await expect(page.getByText("Sampler")).toBeVisible();
    const samplerSelect = page.locator("select").nth(1);
    await expect(samplerSelect).toContainText("Euler Ancestral");
  });

  test("generate button is disabled when prompt is empty", async ({
    page,
  }) => {
    const generateBtn = page.getByRole("button", { name: "Generate" });
    await expect(generateBtn).toBeDisabled();
  });

  test("generate button enables when prompt is entered", async ({ page }) => {
    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("A beautiful sunset over mountains");
    const generateBtn = page.getByRole("button", { name: "Generate" });
    await expect(generateBtn).toBeEnabled();
  });

  test("displays Ctrl+Enter hint", async ({ page }) => {
    await expect(page.getByText("Ctrl+Enter to generate")).toBeVisible();
  });

  test("displays empty state message", async ({ page }) => {
    await expect(page.getByText("Ready to generate")).toBeVisible();
    await expect(
      page.getByText("Enter a prompt and click Generate to begin"),
    ).toBeVisible();
  });
});
