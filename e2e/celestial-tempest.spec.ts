import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90000);

async function finishPassage(page: Page) {
  const input = page.getByTestId("typing-input");
  await expect(input).toBeEnabled();
  const text = await page.getByTestId("passage").innerText();
  await input.focus();
  await page.keyboard.type(text, { delay: 10 });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`Celestial Tempest summons, attacks and recovers at ${viewport.width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/battle");
    await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
    await page.getByRole("button", { name: /Shadow Ninja/ }).click();
    await page.getByRole("button", { name: /Pirate Brawler/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
    for (let i = 0; i < 4; i++) await finishPassage(page);
    const finisher = page.getByRole("button", { name: /5 Celestial Tempest/ });
    await expect(finisher).toBeEnabled();
    await finisher.click();
    await finishPassage(page);
    await expect(page.locator(".hud-hint")).toContainText("Celestial Tempest unleashed");

    // Phase-by-phase frames are captured by attack-animations.spec.ts. A winning hit
    // replaces the canvas with results, so this gameplay check captures the whole page.
    await page.screenshot({ path: `.local/tempest-${viewport.width}-gameplay.png` });
    await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
