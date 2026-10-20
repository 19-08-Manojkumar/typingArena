import { test, expect } from "@playwright/test";

test.setTimeout(120000);

test("racing serves fresh text after completion, replay and page reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/racing");
  await page.getByLabel("AI DIFFICULTY").selectOption("easy");
  await page.getByLabel("RACE DISTANCE").selectOption("2200");
  await page.getByLabel("PASSAGE LENGTH").selectOption("short");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  const input = page.getByTestId("typing-input");
  const passage = page.getByTestId("passage");
  await expect(input).toBeEnabled();
  const seen = [await passage.innerText()];
  for (let i = 0; i < 3; i++) {
    await input.focus();
    await page.keyboard.type(seen.at(-1)!, { delay: 2 });
    await expect(passage).not.toHaveText(seen.at(-1)!);
    seen.push(await passage.innerText());
    await expect(input).toBeFocused();
  }
  await page.getByRole("button", { name: "Restart game" }).click();
  await expect(passage).not.toHaveText(seen.at(-1)!);
  seen.push(await passage.innerText());
  expect(new Set(seen).size).toBe(seen.length);
  const unused = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("typing-arena:racing-passages:easy:v1")!).remaining.length,
  );
  await page.reload();
  await page.getByLabel("AI DIFFICULTY").selectOption("easy");
  await page.getByLabel("PASSAGE LENGTH").selectOption("short");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  await expect(passage).not.toHaveText(seen.at(-1)!);
  expect(seen).not.toContain(await passage.innerText());
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("typing-arena:racing-passages:easy:v1")!).remaining
          .length,
    ),
  ).toBe(unused - 1);
  expect(errors).toEqual([]);
});

test("racing dashboard, nitro, pause, mobile resize and replay", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/racing");
  await page.getByLabel("AI DIFFICULTY").selectOption("easy");
  await page.getByLabel("RACE DISTANCE").selectOption("2200");
  await page.getByLabel("PASSAGE LENGTH").selectOption("long");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await expect(page.getByTestId("nitro-button")).toBeDisabled();
  await expect(page.getByRole("progressbar", { name: "Race progress" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.screenshot({ path: ".local/racing-updated-start.png" });

  const input = page.getByTestId("typing-input");
  const passage = await page.getByTestId("passage").innerText();
  await input.focus();
  await page.keyboard.type(passage.slice(0, 45), { delay: 10 });
  await expect(page.getByTestId("nitro-button")).toBeEnabled();
  await expect(page.getByRole("progressbar", { name: "Race progress" })).not.toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.keyboard.press("Enter");
  const boost = page.getByRole("progressbar", { name: "NITRO ACTIVE" });
  await expect(boost).toBeVisible();
  await expect(page.getByTestId("nitro-button")).toBeDisabled();
  await page.screenshot({ path: ".local/racing-updated-nitro.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
  const stoppedBoost = await boost.getAttribute("aria-valuenow");
  const stoppedProgress = await page
    .getByRole("progressbar", { name: "Race progress" })
    .getAttribute("aria-valuenow");
  await page.waitForTimeout(250);
  await expect(boost).toHaveAttribute("aria-valuenow", stoppedBoost!);
  await expect(page.getByRole("progressbar", { name: "Race progress" })).toHaveAttribute(
    "aria-valuenow",
    stoppedProgress!,
  );

  await page.getByRole("button", { name: "Resume game" }).click();
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 900, height: 600 },
    { width: 390, height: 844 },
    { width: 390, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.locator("canvas").evaluate((canvas) => {
          const element = canvas as HTMLCanvasElement;
          const box = element.getBoundingClientRect();
          return Math.abs(box.width / box.height - element.width / element.height);
        }),
      )
      .toBeLessThan(0.01);
    await expect
      .poll(() =>
        page.locator("canvas").evaluate((canvas) => {
          const box = canvas.getBoundingClientRect();
          const panel = canvas.parentElement!.getBoundingClientRect();
          return Math.max(Math.abs(box.width - panel.width), Math.abs(box.left - panel.left));
        }),
      )
      .toBeLessThan(2);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          scroll: document.documentElement.scrollHeight,
          width: document.documentElement.scrollWidth,
        })),
      )
      .toEqual({ scroll: viewport.height, width: viewport.width });
    const inputBox = await input.boundingBox();
    expect(inputBox!.y + inputBox!.height).toBeLessThan(viewport.height);
    await expect(page.getByTestId("nitro-button")).toBeVisible();
    await page.screenshot({
      path: `.local/racing-updated-${viewport.width}-${viewport.height}.png`,
    });
  }
  await page.getByRole("button", { name: "Restart game" }).click();
  await expect(page.getByRole("progressbar", { name: "Race progress" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.getByRole("progressbar", { name: "NITRO CHARGE" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 45000 });
  await page.getByRole("link", { name: "Leave game" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("race lights and flags follow the countdown, pause and restart", async ({ page }) => {
  await page.goto("/racing");
  await page.getByLabel("RACE DISTANCE").selectOption("2200");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  const signal = page.getByTestId("race-start-signal");
  const count = page.getByTestId("race-start-count");
  const input = page.getByTestId("typing-input");
  await expect(count).toHaveText("3");
  await expect(input).toBeDisabled();
  await expect(signal.locator('.race-start-lamp[data-on="true"]')).toHaveCount(1);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  await expect(count).toHaveText("2");
  await expect(signal.locator('.race-start-lamp[data-on="true"]')).toHaveCount(2);
  await page.screenshot({ path: ".local/racing-start-red.png" });
  await expect(count).toHaveText("1");
  await expect(signal.locator('.race-start-lamp[data-on="true"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
  await expect(signal).toHaveCount(0);
  await page.waitForTimeout(1100);
  await expect(input).toBeDisabled();
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(count).toHaveText("1");
  await expect(signal).toHaveAttribute("data-phase", "go");
  await expect(count).toHaveText("GO!");
  await expect(signal.getByRole("img", { name: "Green lights. Go!" })).toBeVisible();
  await expect(input).toBeEnabled();
  await expect(signal.locator(".race-start-flag")).toHaveCount(2);
  await expect(signal.locator(".race-start-flag.left")).toHaveCSS(
    "animation-name",
    "race-flag-left",
  );
  await page.screenshot({ path: ".local/racing-start-green.png" });
  await expect(signal).toHaveCount(0);
  await expect(input).toBeEnabled();
  await page.getByRole("button", { name: "Restart game" }).click();
  await expect(count).toHaveText("3");
  await expect(signal).toHaveAttribute("data-phase", "countdown");
  await expect(signal.locator('.race-start-lamp[data-on="true"]')).toHaveCount(1);
  await expect(input).toBeDisabled();
});

test("nitro cannot be used with a full meter after speed has decayed", async ({ page }) => {
  // The renderer fixture checks the stopped/charged state directly; this checks the real HUD.
  await page.goto("/racing");
  await page.getByLabel("RACE DISTANCE").selectOption("2200");
  await page.getByRole("button", { name: /Specter R/ }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  const passage = await page.getByTestId("passage").innerText();
  await page.getByTestId("typing-input").focus();
  await page.keyboard.type(passage.slice(0, 42), { delay: 5 });
  await expect(page.getByTestId("nitro-button")).toBeEnabled();
  await expect(page.getByTestId("nitro-button")).toBeDisabled({ timeout: 10000 });
  await expect(page.locator(".racing-feedback")).toHaveText("TYPE TO LAUNCH NITRO");
  await expect(page.getByRole("progressbar", { name: "NITRO CHARGE" })).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
});

test("mobile start signal fits the track and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "typing-arena:v1",
      JSON.stringify({
        version: 1,
        settings: { reducedMotion: true, sound: false },
      }),
    );
  });
  await page.goto("/racing");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  const signal = page.getByTestId("race-start-signal");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  await expect(signal).toHaveAttribute("data-reduced", "true");
  const track = await page.locator(".stage-visual").boundingBox();
  for (const selector of [".race-start-panel", ".race-start-flag.left", ".race-start-flag.right"]) {
    const box = await signal.locator(selector).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(track!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(track!.x + track!.width);
    expect(box!.y).toBeGreaterThanOrEqual(track!.y);
    expect(box!.y + box!.height).toBeLessThanOrEqual(track!.y + track!.height);
  }
  await page.screenshot({ path: ".local/racing-start-mobile.png" });
  await expect(signal).toHaveAttribute("data-phase", "go");
  await expect(signal.locator(".race-start-flag.left")).toHaveCSS("animation-name", "none");
  await expect(signal.locator(".race-start-flag.right")).toHaveCSS("animation-name", "none");
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await expect(signal).toHaveCount(0);
});
