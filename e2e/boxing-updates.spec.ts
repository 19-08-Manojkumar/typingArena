import { test, expect, type Page } from "@playwright/test";
import { buildRenderer } from "./fixtures/build-renderer";
import type { BoxerPose } from "@/game/scenes/BoxerRig";

type BoxState = {
  impactMs: number;
  durationMs: number;
  baseline: number;
  objects: number;
  tweens: number;
  damageLabels: number;
  contacts: number;
  actors: { x: number; y: number; angle: number; scaleX: number; pose: BoxerPose; busy: boolean }[];
};
declare global {
  interface Window {
    boxLab: {
      play(move: string, reverse?: boolean, compact?: boolean, reduced?: boolean): BoxState;
      advance(ms: number): BoxState;
      pause(paused: boolean): void;
      state(): BoxState;
    };
  }
}
let bundle: Buffer;
test.beforeAll(async () => {
  bundle = await buildRenderer("boxing-renderer", [
    "e2e/fixtures/boxing-stage.ts",
    "game/scenes/BoxingAnimator.ts",
    "game/scenes/BoxerRig.ts",
    "game/systems/BoxingPresentation.ts",
  ]);
});
async function renderer(page: Page) {
  await page.route("**/boxing-renderer", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html><head><meta charset="utf-8"></head><body style="margin:0;background:#111c2b"><div id="stage"></div><script src="/boxing-renderer.js"></script></body></html>',
    }),
  );
  await page.route("**/boxing-renderer.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.goto("/boxing-renderer");
  await page.waitForFunction(() => !!window.boxLab);
}

for (const move of ["jab", "cross", "hook", "uppercut", "flurry", "counter", "guard"]) {
  test(`${move}: distinct pose, timed contact, pause and complete cleanup`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await renderer(page);
    const rest = await page.evaluate(
      (move) => window.boxLab.play(move, move === "counter" || move === "guard"),
      move,
    );
    const windup = await page.evaluate(() => window.boxLab.advance(125));
    if (move === "uppercut") expect(windup.actors[0].pose.rearY).toBeGreaterThan(-70);
    const before = await page.evaluate((ms) => window.boxLab.advance(ms), rest.impactMs - 145);
    expect(before.damageLabels).toBe(0);
    await page.evaluate(() => window.boxLab.pause(true));
    const paused = await page.evaluate(() => window.boxLab.advance(500));
    expect(paused.actors).toEqual(before.actors);
    expect(paused.contacts).toBe(before.contacts);
    await page.evaluate(() => window.boxLab.pause(false));
    const hit = await page.evaluate(() => window.boxLab.advance(40));
    expect(hit.damageLabels).toBe(1);
    expect(hit.contacts).toBe(move === "flurry" ? 3 : move === "cross" ? 2 : 1);
    const pose = hit.actors[0].pose;
    if (move === "jab") expect(pose.leadX).toBeGreaterThan(90);
    if (move === "cross" || move === "counter") expect(pose.rearX).toBeGreaterThan(80);
    if (move === "hook") expect(pose.leadY).toBeGreaterThan(-75);
    if (move === "uppercut") expect(pose.rearY).toBeLessThan(-100);
    if (move === "flurry") expect(pose.leadAngle).toBeLessThan(-55);
    if (move === "guard") expect(hit.actors[1].pose.leadY).toBeLessThan(-110);
    await page.screenshot({ path: `.local/boxing-${move}.png` });
    const settled = await page.evaluate(() => window.boxLab.advance(1800));
    expect(settled.objects).toBe(rest.baseline);
    expect(settled.tweens).toBe(0);
    settled.actors.forEach((actor, i) => {
      expect(actor.x).toBe(rest.actors[i].x);
      expect(actor.y).toBe(rest.actors[i].y);
      expect(actor.angle).toBe(0);
      expect(actor.pose).toEqual(rest.actors[i].pose);
      expect(actor.busy).toBe(false);
    });
    expect(errors).toEqual([]);
  });
}

test("compact reversed boxing and reduced motion retain feedback without drift", async ({
  page,
}) => {
  await renderer(page);
  for (const reduced of [false, true]) {
    const rest = await page.evaluate(
      (reduced) => window.boxLab.play("flurry", true, true, reduced),
      reduced,
    );
    const hit = await page.evaluate(() => window.boxLab.advance(740));
    expect(hit.damageLabels).toBe(1);
    if (reduced) {
      expect(hit.actors.map((actor) => actor.pose)).toEqual(rest.actors.map((actor) => actor.pose));
      expect(hit.contacts).toBe(0);
      expect(hit.actors.map((actor) => actor.x)).toEqual(rest.actors.map((actor) => actor.x));
    }
    await page.screenshot({ path: `.local/boxing-compact-${reduced}.png` });
    const settled = await page.evaluate(() => window.boxLab.advance(1600));
    expect(settled.objects).toBe(rest.baseline);
    expect(settled.actors.map((actor) => actor.x)).toEqual([585, 375]);
  }
});

test("boxing artwork, move selection, charged flurry, responsive controls and replay", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".mode-card.combat").getByTestId("boxing-art")).toBeVisible();
  await page.locator(".mode-card.combat").screenshot({ path: ".local/boxing-overview.png" });
  await page.goto("/combat");
  await expect(page.locator(".boxing-intro").getByTestId("boxing-art")).toBeVisible();
  await page.locator(".boxing-intro").screenshot({ path: ".local/boxing-intro.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".boxing-intro").screenshot({ path: ".local/boxing-intro-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: /Standard bout/ }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 45000 });
  const input = page.getByTestId("typing-input");
  await expect(input).toBeEnabled({ timeout: 15000 });
  await expect(page.getByTestId("boxing-move-flurry")).toBeDisabled();
  for (const [index, move] of ["hook", "jab", "cross"].entries()) {
    if (index === 0) await page.getByTestId(`boxing-move-${move}`).click();
    else await page.keyboard.press(index === 1 ? "Alt+1" : "Control+Shift+2");
    await expect(page.getByTestId(`boxing-move-${move}`)).toHaveAttribute("aria-pressed", "true");
    await expect(input).toBeFocused();
    const passage = await page.getByTestId("passage").innerText();
    await page.keyboard.type(passage, { delay: 80 });
    await expect(page.getByTestId("boxing-last-hit")).toContainText(
      ["Body hook", "Snap jab", "One-two cross"][index],
    );
    await page.waitForTimeout(800);
  }
  await expect(page.getByTestId("boxing-move-flurry")).toBeEnabled();
  await page.keyboard.press("Alt+5");
  await expect(page.getByTestId("boxing-move-flurry")).toHaveAttribute("aria-pressed", "true");
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 390, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const input = document.querySelector(".typing-panel")!.getBoundingClientRect();
          return {
            scroll: document.documentElement.scrollHeight,
            width: document.documentElement.scrollWidth,
            fits: input.bottom <= innerHeight + 1,
          };
        }),
      )
      .toEqual({ scroll: viewport.height, width: viewport.width, fits: true });
    await expect(page.getByTestId("boxing-move-flurry")).toBeVisible();
    await page.screenshot({ path: `.local/boxing-ui-${viewport.width}-${viewport.height}.png` });
  }
  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(page.getByTestId("boxing-move-jab")).toBeDisabled();
  await page.getByRole("button", { name: "Resume game" }).click();
  await input.focus();
  await page.keyboard.type(await page.getByTestId("passage").innerText(), { delay: 80 });
  await expect(page.getByTestId("boxing-last-hit")).toContainText("Ringside flurry");
  for (
    let i = 0;
    i < 3 && !(await page.getByRole("region", { name: "Game results" }).isVisible());
    i++
  ) {
    await page.waitForTimeout(1200);
    if (!(await input.isVisible()) || !(await input.isEnabled())) break;
    await input.focus();
    await page.keyboard.type(await page.getByTestId("passage").innerText(), { delay: 80 });
  }
  await expect(page.getByRole("region", { name: "Game results" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByTestId("boxing-move-flurry")).toBeDisabled();
  await expect(page.getByRole("progressbar", { name: "POWER CHARGE" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("link", { name: "Leave game" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
