import { test, expect, type Page } from "@playwright/test";

async function completeSentence(page: Page) {
  await expect(page.getByTestId("typing-input")).toBeEnabled({ timeout: 8000 });
  const text = await page.getByTestId("passage").innerText();
  await page.getByTestId("typing-input").focus();
  await page.keyboard.type(text, { delay: 15 });
  return text;
}

test("battle fits laptop and mobile viewports and changes sentences", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/battle");
  await page.getByLabel("OPPONENT DIFFICULTY").selectOption("easy");
  await page.getByRole("button", { name: /Dark Hunter/ }).click();
  await page.getByRole("button", { name: /Pirate Brawler/ }).click();
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 390, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          scroll: document.documentElement.scrollHeight,
          height: window.innerHeight,
        })),
      )
      .toEqual({ scroll: viewport.height, height: viewport.height });
    const box = await page.getByTestId("typing-input").boundingBox();
    expect(box!.y + box!.height).toBeLessThan(viewport.height);
    await expect(page.getByRole("progressbar", { name: "SPIRIT", exact: true })).toBeVisible();
    await page.screenshot({ path: `.local/battle-${viewport.width}-${viewport.height}.png` });
  }
  const first = await completeSentence(page);
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await expect(page.getByTestId("passage")).not.toHaveText(first);
});

test("Dark Hunter summons a creature and then an army after completed casts", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/battle");
  await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
  await page.getByRole("button", { name: /Dark Hunter/ }).click();
  await page.getByRole("button", { name: /Pirate Brawler/ }).click();
  await completeSentence(page);
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  const summon = page.getByRole("button", { name: /2 Shadow Summon/ });
  await expect(summon).toBeEnabled();
  await summon.click();
  await completeSentence(page);
  await expect(page.locator(".hud-hint")).toContainText("Shadow Summon unleashed");
  await page.waitForTimeout(350);
  await page.screenshot({ path: ".local/shadow-summon.png" });
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await page.getByRole("button", { name: "Restart game" }).click();
  for (let i = 0; i < 3; i++) {
    await completeSentence(page);
    await expect(page.getByTestId("typing-input")).toBeEnabled();
  }
  await page.getByRole("button", { name: /4 Shadow Army/ }).click();
  await completeSentence(page);
  await expect(page.locator(".hud-hint")).toContainText("Shadow Army unleashed");
  await page.waitForTimeout(650);
  await page.screenshot({ path: ".local/shadow-army.png" });
  await page.waitForTimeout(2000);
  expect(errors).toEqual([]);
});

for (const fighter of [
  { name: "Shadow Ninja", advanced: "Crescent Barrage", supreme: "Celestial Tempest" },
  { name: "Precision Swordsman", advanced: "Moonfall Cleave", supreme: "Heaven Splitter" },
  { name: "Dark Hunter", advanced: "Night Warden", supreme: "Eclipse Dominion" },
  { name: "Pirate Brawler", advanced: "Tidal Breaker", supreme: "Worldbreaker" },
]) {
  test(`${fighter.name}: keyboard powers and both new animations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/battle");
    await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
    await page.getByRole("button", { name: new RegExp(fighter.name) }).click();
    await page.getByRole("button", { name: /Pirate Brawler/ }).click();
    await expect(page.locator(".ability-button")).toHaveCount(5);
    await expect(page.getByTestId("typing-input")).toBeEnabled();
    // A locked power shortcut must not insert text or bypass spirit requirements.
    await page.getByTestId("typing-input").focus();
    await page.keyboard.press("Alt+5");
    await expect(page.getByTestId("passage").locator(".correct, .incorrect")).toHaveCount(0);
    await expect(page.locator(".ability-button.active")).not.toContainText(fighter.supreme);
    for (let i = 0; i < 2; i++) {
      await completeSentence(page);
      await expect(page.getByTestId("typing-input")).toBeEnabled();
    }
    await page.keyboard.press("Alt+3");
    await expect(page.locator(".ability-button.active")).toContainText(fighter.advanced);
    await expect(page.getByTestId("typing-input")).toBeFocused();
    await completeSentence(page);
    await expect(page.locator(".hud-hint")).toContainText(`${fighter.advanced} unleashed`);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `.local/${fighter.advanced.replaceAll(" ", "-")}.png` });
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Restart game" }).click();
    for (let i = 0; i < 4; i++) {
      await completeSentence(page);
      await expect(page.getByTestId("typing-input")).toBeEnabled();
    }
    await expect(page.getByRole("button", { name: new RegExp(fighter.supreme) })).toBeEnabled();
    await page.keyboard.press("Control+Shift+5");
    await expect(page.locator(".ability-button.active")).toContainText(fighter.supreme);
    await expect(page.getByTestId("passage").locator(".correct, .incorrect")).toHaveCount(0);
    await completeSentence(page);
    await expect(page.locator(".hud-hint")).toContainText(`${fighter.supreme} unleashed`);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `.local/${fighter.supreme.replaceAll(" ", "-")}.png` });
    await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
