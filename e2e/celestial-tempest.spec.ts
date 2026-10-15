import { expect, test, type Page } from "@playwright/test";

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
    for (let i = 0; i < 4; i++) await finishPassage(page);
    const finisher = page.getByRole("button", { name: /5 Celestial Tempest/ });
    await expect(finisher).toBeEnabled();
    await finisher.click();
    await finishPassage(page);
    await expect(page.locator(".hud-hint")).toContainText("Celestial Tempest unleashed");

    const arena = page.getByRole("img", { name: "battle game scene" });
    // Keep frames from each phase for visual review, including the compact mobile camera.
    for (const [phase, wait] of [
      ["army", 610],
      ["assault", 550],
      ["core", 500],
      ["blast", 420],
    ] as const) {
      await page.waitForTimeout(wait);
      await arena.screenshot({ path: `.local/tempest-${viewport.width}-${phase}.png` });
    }
    await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
