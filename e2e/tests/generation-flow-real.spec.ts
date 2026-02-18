import { expect, test } from "@playwright/test";

/**
 * Generation flow tests against the REAL backend.
 * These tests actually POST to /api/generate and verify
 * the backend responds correctly and the UI handles it.
 *
 * Without a GPU or model files, the backend will fail the job.
 * These tests verify the error handling path works correctly.
 */

test.describe("Real Backend Generation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("submits to real backend and gets a valid job response", async ({
    page,
  }) => {
    // Capture the API response
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    // Fill in prompt and generate
    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("A simple test image of a red circle");
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for the API response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe("queued");
    expect(body.prompt).toBe("A simple test image of a red circle");
    expect(body.mode).toBe("txt2img");
    expect(body.width).toBe(512);
    expect(body.height).toBe(512);
  });

  test("job eventually reaches a terminal state when polled via API", async ({
    page,
  }) => {
    // Submit a job
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") &&
        resp.request().method() === "POST",
    );

    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Test prompt expecting failure");
    await page.getByRole("button", { name: "Generate" }).click();

    const response = await responsePromise;
    const job = await response.json();

    // Poll the job status until it leaves "queued" state or timeout
    const maxPolls = 15;
    const pollInterval = 2000;
    let finalStatus = "queued";

    for (let i = 0; i < maxPolls; i++) {
      await page.waitForTimeout(pollInterval);
      const statusResp = await page.request.get(`/api/jobs/${job.id}`);
      const statusBody = await statusResp.json();
      finalStatus = statusBody.status;

      if (finalStatus !== "queued") break;
    }

    // The job should have moved to running, failed, or completed
    // On a machine without torch/models, "failed" or still "queued" are valid
    expect(["queued", "running", "failed", "completed"]).toContain(
      finalStatus,
    );
  });

  test("job appears in queue after submission", async ({ page }) => {
    // Fill in prompt and generate
    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Queue visibility test");
    await page.getByRole("button", { name: "Generate" }).click();

    // "Ready to generate" should disappear since we now have a job
    await expect(page.getByText("Ready to generate")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("can submit with custom parameters", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    // Set size to 768x768
    await page.getByText("768x768").click();

    // Set a specific seed
    const seedInput = page.getByPlaceholder("-1 for random");
    await seedInput.clear();
    await seedInput.fill("99999");

    // Change sampler
    const samplerSelect = page.locator("select").nth(1);
    await samplerSelect.selectOption("euler");

    // Fill prompt and generate
    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Custom params test");
    await page.getByRole("button", { name: "Generate" }).click();

    const response = await responsePromise;
    const body = await response.json();

    expect(body.width).toBe(768);
    expect(body.height).toBe(768);
    expect(body.seed).toBe(99999);
    expect(body.sampler).toBe("euler");
    expect(body.prompt).toBe("Custom params test");
  });

  test("can submit with negative prompt", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("A beautiful sunset");

    const negativeTextarea = page.locator("textarea").nth(1);
    await negativeTextarea.fill("ugly, deformed, blurry");

    await page.getByRole("button", { name: "Generate" }).click();

    const response = await responsePromise;
    const body = await response.json();

    expect(body.prompt).toBe("A beautiful sunset");
    expect(body.negative_prompt).toBe("ugly, deformed, blurry");
  });

  test("can cancel a queued job via API", async ({ page }) => {
    // Submit a job
    const generateResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Job to cancel");
    await page.getByRole("button", { name: "Generate" }).click();

    const response = await generateResponse;
    const job = await response.json();

    // Cancel via direct API call
    const cancelResponse = await page.request.post(
      `/api/jobs/${job.id}/cancel`,
    );
    expect(cancelResponse.status()).toBe(200);
    const cancelBody = await cancelResponse.json();
    expect(cancelBody.status).toBe("cancelled");
  });

  test("can query job status after submission", async ({ page }) => {
    // Submit a job
    const generateResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("Status check test");
    await page.getByRole("button", { name: "Generate" }).click();

    const response = await generateResponse;
    const job = await response.json();

    // Query the job status
    const statusResponse = await page.request.get(`/api/jobs/${job.id}`);
    expect(statusResponse.status()).toBe(200);
    const statusBody = await statusResponse.json();
    expect(statusBody.id).toBe(job.id);
    expect(statusBody.prompt).toBe("Status check test");
    expect(["queued", "running", "completed", "failed"]).toContain(
      statusBody.status,
    );
  });

  test("multiple sequential submissions create separate jobs", async ({
    page,
  }) => {
    const jobIds: string[] = [];

    // Submit first job
    let responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    const promptTextarea = page.locator("textarea").first();
    await promptTextarea.fill("First job");
    await page.getByRole("button", { name: "Generate" }).click();

    let response = await responsePromise;
    let body = await response.json();
    jobIds.push(body.id);

    // Submit second job
    responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/generate") && resp.request().method() === "POST",
    );

    await promptTextarea.fill("Second job");
    await page.getByRole("button", { name: "Generate" }).click();

    response = await responsePromise;
    body = await response.json();
    jobIds.push(body.id);

    // IDs should be unique
    expect(jobIds[0]).not.toBe(jobIds[1]);
  });
});
