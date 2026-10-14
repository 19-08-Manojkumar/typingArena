import { test, expect, type Page } from "@playwright/test";

async function waitForTyping(page: Page) {
  const resume = page.getByRole("button", { name: "Resume game" });
  if (await resume.isVisible()) await resume.click();
  await expect(page.getByTestId("typing-input")).toBeEnabled({ timeout: 15000 });
  await page.getByTestId("typing-input").focus();
}
async function typeChallenge(page: Page, delay = 12) {
  await page.waitForFunction(
    () => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="typing-input"]');
      return !input || !input.disabled;
    },
    undefined,
    { timeout: 6000 },
  );
  const remaining = await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('[data-testid="typing-input"]');
    if (!input || input.disabled) return null;
    input.focus({ preventScroll: true });
    return [...document.querySelectorAll('[data-testid="passage"] .pending')]
      .map((node) => node.textContent)
      .join("");
  });
  if (remaining) await page.keyboard.type(remaining, { delay });
}

async function expectSingleViewport(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const arena = document.querySelector(".stage-visual")?.getBoundingClientRect();
        const typing = document.querySelector(".typing-panel")?.getBoundingClientRect();
        return (
          !!arena &&
          !!typing &&
          arena.top >= 0 &&
          typing.bottom <= window.innerHeight + 1 &&
          document.documentElement.scrollHeight <= window.innerHeight + 1
        );
      }),
    )
    .toBe(true);
}
test("menu, responsive layout, settings, persistence, and reset", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Less scrolling. More winning." })).toBeVisible();
  await expect(page.locator(".mode-card")).toHaveCount(3);
  await page.screenshot({ path: ".local/menu-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({ path: ".local/menu-mobile.png", fullPage: true });
  await page.goto("/settings");
  await page.getByRole("textbox", { name: "DISPLAY NAME" }).fill("Neon Pilot");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "DISPLAY NAME" })).toHaveValue("Neon Pilot");
  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.getByRole("button", { name: "Keep my progress" }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("typing-arena:v1")!).displayName),
  ).toBe("Neon Pilot");
  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.getByRole("button", { name: "Yes, reset everything" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("typing-arena:v1")!).xp)).toBe(
    0,
  );
});
test("racing input, correction, pause, finish, replay, and Phaser cleanup", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/racing");
  await page.getByLabel("AI DIFFICULTY").selectOption("easy");
  await page.getByLabel("RACE DISTANCE").selectOption("800");
  await page.getByRole("button", { name: /Pulse GT/ }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await waitForTyping(page);
  await expectSingleViewport(page);
  await page.getByTestId("typing-input").pressSequentially("x");
  await expect(page.getByTestId("passage").locator(".incorrect")).toHaveCount(1);
  await page.getByTestId("typing-input").press("Backspace");
  await expect(page.getByTestId("passage").locator(".incorrect")).toHaveCount(0);
  await page.getByTestId("typing-input").press("Escape");
  await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume game" }).click();
  await page.screenshot({ path: ".local/racing.png", fullPage: true });
  for (let i = 0; i < 30; i++) {
    if (await page.getByRole("region", { name: "Game results" }).isVisible()) break;
    await typeChallenge(page);
    if (
      await page
        .getByRole("button", { name: "Nitro Enter" })
        .isEnabled({ timeout: 300 })
        .catch(() => false)
    )
      await page.keyboard.press("Enter");
    await page.waitForTimeout(90);
  }
  await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  const xp = await page.evaluate(() => JSON.parse(localStorage.getItem("typing-arena:v1")!).xp);
  expect(xp).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto("/results");
  await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("fighter selection, specials, battle victory, and offline gameplay", async ({
  page,
  context,
}) => {
  await page.goto("/battle");
  await expect(page.locator(".fighter-card")).toHaveCount(4);
  await page.getByLabel("OPPONENT DIFFICULTY").selectOption("easy");
  await page.getByRole("button", { name: /Shadow Ninja/ }).click();
  await expect(page.getByRole("heading", { name: /Choose your opponent/ })).toBeVisible();
  await page.getByRole("button", { name: /Dark Hunter/ }).click();
  await waitForTyping(page);
  await expectSingleViewport(page);
  await context.setOffline(true);
  await page.screenshot({ path: ".local/battle.png", fullPage: true });
  for (let i = 0; i < 20; i++) {
    if (await page.getByRole("region", { name: "Game results" }).isVisible()) break;
    const special = page.getByRole("button", { name: /2 Shadow Clone/ });
    if (await special.isEnabled({ timeout: 300 }).catch(() => false))
      await special.click({ timeout: 500 });
    await typeChallenge(page, 18);
    await page.waitForTimeout(100);
  }
  await expect(page.getByRole("heading", { name: "Victory looks good on you." })).toBeVisible();
  await context.setOffline(false);
  await page.screenshot({ path: ".local/victory.png", fullPage: true });
});
test("boxing combinations, responsive HUD, and completion", async ({ page }) => {
  await page.goto("/combat");
  await page.getByLabel("OPPONENT DIFFICULTY").selectOption("easy");
  await page.getByRole("button", { name: /Quick bout/ }).click();
  await waitForTyping(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await expectSingleViewport(page);
  await page.screenshot({ path: ".local/combat-mobile.png", fullPage: true });
  for (let i = 0; i < 55; i++) {
    if (await page.getByRole("region", { name: "Game results" }).isVisible()) break;
    await typeChallenge(page, 65);
    await page.waitForTimeout(100);
  }
  await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
});
test("corrupted saves recover and all routes load", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("typing-arena:v1", "broken-json");
  });
  for (const route of ["/", "/modes", "/characters", "/records", "/settings", "/results"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".notice")).toContainText("fresh session");
  }
});
