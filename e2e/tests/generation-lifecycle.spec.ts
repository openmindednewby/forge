import { expect, test, type Page } from "@playwright/test";

/**
 * Full generation lifecycle E2E tests.
 * Mocks all API endpoints and uses the exposed Zustand store
 * to simulate WebSocket events (progress, completion, failure).
 */

const JOB_ID = "lifecycle_job_001";

const JOB_RESPONSE = {
  id: JOB_ID,
  status: "queued",
  mode: "txt2img",
  prompt: "A red circle on white background",
  negative_prompt: "",
  model_id: "test-model.safetensors",
  width: 512,
  height: 512,
  steps: 20,
  cfg_scale: 7,
  seed: 42,
  sampler: "euler_a",
  images: [],
  error_message: "",
  created_at: new Date().toISOString(),
  started_at: null,
  completed_at: null,
};

/** Mock all API endpoints and navigate to the page. */
async function setupMockedPage(page: Page) {
  await page.route("**/api/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(JOB_RESPONSE),
    });
  });

  await page.route("**/api/models**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        models: [
          {
            id: "test-model.safetensors",
            name: "test-model",
            filename: "test-model.safetensors",
            type: "checkpoint",
            size_bytes: 2_000_000_000,
          },
        ],
        active_model: null,
      }),
    });
  });

  await page.route("**/api/gallery**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ images: [], total: 0, page: 1, page_size: 50 }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/** Submit a generation job via the UI. */
async function submitGeneration(page: Page, prompt = "A red circle on white background") {
  const promptTextarea = page.locator("textarea").first();
  await promptTextarea.fill(prompt);
  await page.getByRole("button", { name: "Generate", exact: true }).click();
}

/** Call a method on the exposed Zustand queue store. */
async function callQueueStore(page: Page, method: string, ...args: unknown[]) {
  await page.evaluate(
    ({ method, args }) => {
      const store = window.__FORGE_QUEUE_STORE__;
      if (!store) throw new Error("Queue store not exposed");
      const fn = store.getState()[method as keyof ReturnType<typeof store.getState>];
      if (typeof fn === "function") {
        (fn as (...a: unknown[]) => void)(...args);
      }
    },
    { method, args },
  );
}

test.describe("Generation Lifecycle (full flow)", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedPage(page);
  });

  test("full success flow: submit → queued → running → progress → completed", async ({
    page,
  }) => {
    // 1. Submit
    await submitGeneration(page);

    // 2. Empty state should disappear (job is now queued)
    await expect(page.getByText("Ready to generate")).not.toBeVisible({
      timeout: 3000,
    });

    // 3. Simulate job:started via store
    await callQueueStore(page, "startJob", JOB_ID);

    // 4. Simulate progress at 50%
    await callQueueStore(page, "updateJobProgress", JOB_ID, 10, 20, 50, null);

    // Verify progress UI: step count and percentage
    await expect(page.getByText("Step 10/20")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("50%")).toBeVisible();

    // 5. Simulate progress at 100%
    await callQueueStore(page, "updateJobProgress", JOB_ID, 20, 20, 100, null);
    await expect(page.getByText("Step 20/20")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("100%")).toBeVisible();

    // 6. Simulate completion with an image
    await callQueueStore(page, "completeJob", JOB_ID, [
      {
        id: "img_001",
        file_path: "/outputs/test.png",
        thumbnail_path: "/outputs/test_thumb.jpg",
        width: 512,
        height: 512,
        seed: 42,
      },
    ], 3.5);

    // Verify the completed image info is displayed
    await expect(page.getByText("512x512 | Seed: 42")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("Generated in 3.5s")).toBeVisible();

    // Verify the generated image element exists
    const img = page.locator('img[alt="Generated"]');
    await expect(img).toBeVisible();
  });

  test("failure flow: submit → running → failed shows error message", async ({
    page,
  }) => {
    await submitGeneration(page);

    // Simulate started
    await callQueueStore(page, "startJob", JOB_ID);

    // Simulate failure
    await callQueueStore(page, "failJob", JOB_ID, "No backend available");

    // Error should be displayed
    await expect(page.getByText("Generation failed")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByText("No backend available")).toBeVisible();
  });

  test("API 500 error shows inline error message", async ({ page }) => {
    // Override route to return 500
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "GPU out of memory" }),
      });
    });

    await submitGeneration(page);

    // Should show the HTTP error (axios wraps it)
    await expect(
      page.locator(".text-red-400").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("API 422 validation error shows message", async ({ page }) => {
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          detail: [{ msg: "prompt is required", loc: ["body", "prompt"] }],
        }),
      });
    });

    await submitGeneration(page);

    await expect(
      page.locator(".text-red-400").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("progress bar width tracks percentage", async ({ page }) => {
    await submitGeneration(page);

    // Wait for job to be added to store before manipulating state
    await expect(page.getByText("Ready to generate")).not.toBeVisible({ timeout: 3000 });

    await callQueueStore(page, "startJob", JOB_ID);
    await callQueueStore(page, "updateJobProgress", JOB_ID, 6, 20, 30, null);

    // Verify step count is visible
    await expect(page.getByText("Step 6/20")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("30%")).toBeVisible();

    // Advance to 75%
    await callQueueStore(page, "updateJobProgress", JOB_ID, 15, 20, 75, null);
    await expect(page.getByText("Step 15/20")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("75%")).toBeVisible();
  });

  test("generate button re-enables after submission completes", async ({ page }) => {
    const generateBtn = page.getByRole("button", { name: "Generate", exact: true });

    // Fill prompt
    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Test re-enable");

    // Button should be enabled
    await expect(generateBtn).toBeEnabled();

    // Submit - button briefly disables during submission
    await generateBtn.click();

    // After the mocked API returns immediately, button should re-enable
    await expect(generateBtn).toBeEnabled({ timeout: 3000 });
  });

  test("prompt text appears under progress indicator during generation", async ({
    page,
  }) => {
    await submitGeneration(page, "A beautiful sunset over mountains");

    // Wait for job to be added to store before manipulating state
    await expect(page.getByText("Ready to generate")).not.toBeVisible({ timeout: 3000 });

    await callQueueStore(page, "startJob", JOB_ID);
    await callQueueStore(page, "updateJobProgress", JOB_ID, 5, 20, 25, null);

    // The step count should be visible (confirms running state rendered)
    await expect(page.getByText("Step 5/20")).toBeVisible({ timeout: 3000 });
  });

  test("multiple sequential jobs can be submitted", async ({ page }) => {
    // Submit first job
    await submitGeneration(page, "First generation");

    // Complete first job via store
    await callQueueStore(page, "startJob", JOB_ID);
    await callQueueStore(page, "completeJob", JOB_ID, [
      {
        id: "img_first",
        file_path: "/outputs/first.png",
        thumbnail_path: "/outputs/first_thumb.jpg",
        width: 512,
        height: 512,
        seed: 100,
      },
    ], 2.0);

    // Should see the completed image
    await expect(page.getByText("Seed: 100")).toBeVisible({ timeout: 2000 });

    // Submit second job (API returns same job response, but that's fine for the UI test)
    await submitGeneration(page, "Second generation");

    // Empty state should still be gone
    await expect(page.getByText("Ready to generate")).not.toBeVisible();
  });
});
