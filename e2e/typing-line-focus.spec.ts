import { expect, test, type Page } from "@playwright/test";

async function lineState(page: Page) {
  return page.getByTestId("passage").evaluate((node) => {
    const cursor =
      node.querySelector<HTMLElement>(".cursor") ??
      node.querySelector<HTMLElement>("span:last-child")!;
    const bounds = node.getBoundingClientRect(),
      rect = cursor.getBoundingClientRect();
    const style = getComputedStyle(node),
      marker = getComputedStyle(node, "::before");
    return {
      top: rect.top - bounds.top,
      bottom: rect.bottom - bounds.top,
      height: node.clientHeight,
      scroll: node.scrollTop,
      max: node.scrollHeight - node.clientHeight,
      markerTop: parseFloat(marker.top) - node.scrollTop,
      markerHeight: parseFloat(marker.height),
      lineHeight: parseFloat(style.lineHeight),
      pageY: window.scrollY,
      pageX: window.scrollX,
    };
  });
}

async function expectVisibleLine(page: Page) {
  const state = await lineState(page);
  expect(state.top).toBeGreaterThanOrEqual(-1);
  expect(state.bottom).toBeLessThanOrEqual(state.height + 1);
  expect(state.markerTop).toBeGreaterThanOrEqual(-1);
  expect(state.markerTop + state.markerHeight).toBeLessThanOrEqual(state.height + 1);
  expect(state.markerHeight).toBeCloseTo(state.lineHeight, 0);
  expect(state.pageY).toBe(0);
  expect(state.pageX).toBe(0);
  await expect(page.getByTestId("typing-input")).toBeFocused();
  return state;
}

for (const width of [1280, 390]) {
  test(`long passages follow the active line while typing, correcting and resizing at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 640 : 720 });
    await page.goto("/battle");
    await page.getByLabel("OPPONENT DIFFICULTY").selectOption("hard");
    await page.getByRole("button", { name: /Solar Knight/ }).click();
    await page.getByRole("button", { name: /Pirate Brawler/ }).click();
    const input = page.getByTestId("typing-input"),
      passage = page.getByTestId("passage"),
      buttons = page.locator(".ability-button");
    await expect(input).toBeEnabled({ timeout: 15000 });
    for (let round = 0; round < 4 && (await buttons.nth(4).isDisabled()); round++) {
      const text = await passage.innerText();
      await input.focus();
      await page.keyboard.type(text, { delay: 2 });
      await expect(passage).not.toHaveText(text);
      await expect(input).toBeEnabled();
    }
    await buttons.nth(4).click();
    const text = await passage.innerText();
    expect(text.length).toBeGreaterThan(300);
    expect((await lineState(page)).max).toBeGreaterThan(0);
    let position = 0;
    const checkpoints = [0.15, 0.35, 0.6, 0.85].map((fraction) =>
      Math.floor(text.length * fraction),
    );
    for (const end of checkpoints) {
      await page.keyboard.type(text.slice(position, end), { delay: 2 });
      position = end;
      await expectVisibleLine(page);
    }
    expect((await lineState(page)).scroll).toBeGreaterThan(0);
    await page.screenshot({ path: ".local/passages/active-line-" + width + ".png" });
    // A wrong key stays visible and Backspace returns to the previous character.
    await page.keyboard.type(text[position] === "x" ? "z" : "x");
    await expect(passage.locator(".incorrect")).toHaveCount(1);
    await expectVisibleLine(page);
    await page.keyboard.press("Backspace");
    await expect(passage.locator(".incorrect")).toHaveCount(0);
    await expectVisibleLine(page);
    await page.getByRole("button", { name: "Pause game" }).click();
    const paused = await lineState(page);
    await page.getByRole("button", { name: "Resume game" }).click();
    expect((await expectVisibleLine(page)).scroll).toBeCloseTo(paused.scroll, 0);
    // Reflow without a keypress must find the same character in its new line.
    await page.setViewportSize({
      width: width === 390 ? 1280 : 390,
      height: width === 390 ? 720 : 640,
    });
    await expect
      .poll(async () => {
        const state = await lineState(page);
        return state.top >= -1 && state.bottom <= state.height + 1;
      })
      .toBe(true);
    await expectVisibleLine(page);
    for (let remaining = position; remaining > 0; ) {
      const count = Math.min(50, remaining);
      for (let i = 0; i < count; i++) await page.keyboard.press("Backspace");
      remaining -= count;
      await expectVisibleLine(page);
    }
    expect((await lineState(page)).scroll).toBe(0);
    // Switching passages at position zero clears any previous scroll/highlight position.
    await page.keyboard.press("Alt+1");
    await expect(passage).not.toHaveText(text);
    expect((await expectVisibleLine(page)).scroll).toBe(0);
    const next = await passage.innerText();
    await page.keyboard.type(next.slice(0, -1), { delay: 2 });
    await expectVisibleLine(page);
    await page.keyboard.type(next.slice(-1));
    // Keep the final line visible during the attack, then reset for the next sentence.
    const complete = await lineState(page);
    expect(complete.top).toBeGreaterThanOrEqual(-1);
    expect(complete.bottom).toBeLessThanOrEqual(complete.height + 1);
    await expect(passage).not.toHaveText(next);
    expect((await expectVisibleLine(page)).scroll).toBe(0);
    expect(errors).toEqual([]);
  });
}
