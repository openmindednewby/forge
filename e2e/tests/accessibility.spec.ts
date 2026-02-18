import { expect, test } from "@playwright/test";

/**
 * Accessibility tests verifying label/input associations
 * and ARIA attributes on the generation page.
 */
test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("all form labels are associated with their inputs via htmlFor/id", async ({
    page,
  }) => {
    const pairs = [
      { label: "Prompt", id: "prompt" },
      { label: "Negative Prompt", id: "negative-prompt" },
      { label: "Model", id: "model" },
      { label: "Steps", id: "steps" },
      { label: "CFG Scale", id: "cfg-scale" },
      { label: "Seed", id: "seed" },
      { label: "Sampler", id: "sampler" },
    ];

    for (const { label, id } of pairs) {
      const labelEl = page.locator(`label[for="${id}"]`);
      await expect(labelEl).toBeVisible();
      await expect(labelEl).toContainText(label);

      const input = page.locator(`#${id}`);
      await expect(input).toBeVisible();
    }
  });

  test("clicking a label focuses its associated input", async ({ page }) => {
    await page.locator('label[for="prompt"]').click();
    await expect(page.locator("#prompt")).toBeFocused();

    await page.locator('label[for="seed"]').click();
    await expect(page.locator("#seed")).toBeFocused();
  });

  test("random seed button has aria-label", async ({ page }) => {
    const diceButton = page.getByRole("button", { name: "Random seed" });
    await expect(diceButton).toBeVisible();
    await expect(diceButton).toHaveAttribute("aria-label", "Random seed");
  });

  test("generate button has descriptive text", async ({ page }) => {
    const btn = page.getByRole("button", { name: "Generate", exact: true });
    await expect(btn).toBeVisible();
  });

  test("navigation links have descriptive text", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Generate" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gallery" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Models" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });
});
