import { expect, test, type Page } from "@playwright/test";

const villains = ["ninja", "swordsman", "hunter", "brawler"];
async function expectVillains(page: Page) {
  await expect(page.locator(".fighter-card .villain-portrait")).toHaveCount(4);
  for (const id of villains) {
    const card = page.locator(`.fighter-card[data-fighter="${id}"]`);
    await expect(card.locator(`svg[data-villain="${id}"]`)).toBeVisible();
    await expect(card.locator("[data-portrait-detail]")).toHaveCount(1);
  }
}

for (const width of [1440, 390]) {
  test(`villain portraits match their cards in both rosters at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/battle");
    await expect(page.locator(".fighter-card .hero-portrait")).toHaveCount(4);
    await page.getByRole("button", { name: /Solar Knight/ }).click();
    await expectVillains(page);
    for (const id of villains)
      await page
        .locator(`.fighter-card[data-fighter="${id}"] .selection-art`)
        .screenshot({ path: `.local/portraits/${id}-${width}.png` });
    await page.getByRole("button", { name: "Play as Villain" }).click();
    await expectVillains(page);
    await page.getByRole("button", { name: /Dark Hunter/ }).click();
    await expect(page.locator(".fighter-card .hero-portrait")).toHaveCount(4);
    expect(errors).toEqual([]);
  });
}

test("battle passages change after attacks, switching powers, replaying and reloading", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const seen = new Set<string>();
  const remember = async () => {
    const text = await page.getByTestId("passage").innerText();
    expect(seen.has(text)).toBe(false);
    seen.add(text);
    return text;
  };
  const startBattle = async () => {
    await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
    await page.getByRole("button", { name: /Ember Guardian/ }).click();
    await page.getByRole("button", { name: /Pirate Brawler/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId("typing-input")).toBeEnabled({ timeout: 15000 });
  };
  await page.goto("/battle");
  await startBattle();
  const first = await remember();
  await page.getByTestId("typing-input").focus();
  await page.keyboard.type(first, { delay: 3 });
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await expect(page.getByTestId("passage")).not.toHaveText(first);
  const second = await remember();
  await page.keyboard.press("Alt+2");
  await expect(page.locator(".ability-button.active")).toContainText("Phoenix Rush");
  const special = await remember();
  expect(special).not.toBe(second);
  await page.getByRole("button", { name: "Pause game" }).click();
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(page.getByTestId("passage")).toHaveText(special);
  await page.getByRole("button", { name: "Restart game" }).click();
  await expect(page.getByTestId("typing-input")).toBeEnabled({ timeout: 15000 });
  await remember();
  await page.reload();
  await startBattle();
  await remember();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("typing-arena:battle-passages:v2")!),
  );
  expect(saved.decks["ember:ember-fist"].cursor).toBeGreaterThanOrEqual(4);
  expect(errors).toEqual([]);
});
