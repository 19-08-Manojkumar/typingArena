import { expect, test, type Page } from "@playwright/test";

async function typeCast(page: Page) {
  const input = page.getByTestId("typing-input");
  await expect(input).toBeEnabled({ timeout: 15000 });
  await input.focus();
  await page.keyboard.type(await page.getByTestId("passage").innerText(), { delay: 5 });
}

for (const [name, special] of [
  ["Solar Knight", "Aegis Charge"],
  ["Storm Ranger", "Thunder Volley"],
  ["Crystal Sage", "Crystal Bloom"],
  ["Ember Guardian", "Phoenix Rush"],
]) {
  test(`${name}: hero animation integrates with typing, shortcuts, pause and cleanup`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: name === "Storm Ranger" ? 390 : 1280, height: 844 });
    await page.goto("/battle");
    await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await page.getByRole("button", { name: /Pirate Brawler/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
    await typeCast(page);
    await expect(page.getByTestId("typing-input")).toBeEnabled();
    await page.keyboard.press("Alt+2");
    await expect(page.locator(".ability-button.active")).toContainText(special);
    await typeCast(page);
    await expect(page.locator(".hud-hint")).toContainText(`${special} unleashed`);
    await page.getByRole("button", { name: "Pause game" }).click();
    await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
    await page.getByRole("button", { name: "Resume game" }).click();
    await expect(page.getByTestId("typing-input")).toBeEnabled();
    await page.screenshot({ path: `.local/attacks/gameplay-${name.replaceAll(" ", "-")}.png` });
    await page.getByRole("link", { name: "Leave game" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
