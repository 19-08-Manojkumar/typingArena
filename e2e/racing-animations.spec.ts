import { test, expect, type Page } from "@playwright/test";
import { buildRenderer } from "./fixtures/build-renderer";

type RaceState = {
  status: string;
  position: number;
  speed: number;
  nitro: number;
  boost: number;
  finished: boolean;
  place: number;
  objects: number;
  tweens: number;
  confetti: number;
  announcement: string;
  city: number[];
  cars: {
    x: number;
    y: number;
    wheels: number[];
    body: { y: number; angle: number };
    exhaust: boolean;
  }[];
};
declare global {
  interface Window {
    raceLab: {
      advance(ms: number): RaceState;
      type(count: number): RaceState;
      boost(): boolean;
      mistake(): RaceState;
      pause(): RaceState;
      resume(): RaceState;
      resize(width: number): RaceState;
      state(): RaceState;
    };
  }
}
let bundle: Buffer;
test.beforeAll(async () => {
  bundle = await buildRenderer("racing-renderer", [
    "e2e/fixtures/racing-stage.ts",
    "game/scenes/RacingScene.ts",
    "game/scenes/RacingCar.ts",
    "game/systems/RacingSession.ts",
    "game/systems/RacingSystem.ts",
    "game/systems/RacingPresentation.ts",
    "game/systems/GameSession.ts",
    "game/systems/TypingEngine.ts",
    "game/data/vehicles.ts",
    "game/data/passages.ts",
    "lib/scoring.ts",
  ]);
});

async function openStage(page: Page, query = "") {
  await page.route("**/race-renderer?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html><head><meta charset="utf-8"></head><body style="margin:0;background:#0c1428"><div id="stage"></div><script src="/race-renderer.js"></script></body></html>',
    }),
  );
  await page.route("**/race-renderer.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.goto(`/race-renderer?${query}`);
  await page.waitForFunction(() => !!window.raceLab);
  return page.evaluate(() => window.raceLab.advance(3100));
}

for (let vehicle = 0; vehicle < 4; vehicle++) {
  test(`vehicle ${vehicle}: driving, nitro and animation pause`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1000, height: 500 });
    const start = await openStage(page, `vehicle=${vehicle}`);
    const moving = await page.evaluate(() => window.raceLab.type(42));
    expect(moving.position).toBeGreaterThan(start.position);
    expect(moving.cars[0].wheels).not.toEqual(start.cars[0].wheels);
    expect(moving.city).not.toEqual(start.city);
    expect(await page.evaluate(() => window.raceLab.boost())).toBe(true);
    const boost = await page.evaluate(() => window.raceLab.advance(350));
    expect(boost.cars[0].exhaust).toBe(true);
    expect(boost.boost).toBeGreaterThan(0);
    await page.screenshot({ path: `.local/racing/car-${vehicle}-nitro.png` });
    const paused = await page.evaluate(() => window.raceLab.pause());
    const frozen = await page.evaluate(() => window.raceLab.advance(1800));
    expect(frozen.position).toBe(paused.position);
    expect(frozen.boost).toBe(paused.boost);
    expect(frozen.cars).toEqual(paused.cars);
    expect(frozen.city).toEqual(paused.city);
    await page.evaluate(() => window.raceLab.resume());
    const mistake = await page.evaluate(() => window.raceLab.mistake());
    expect(mistake.announcement).toContain("RHYTHM");
    const settled = await page.evaluate(() => window.raceLab.advance(7000));
    expect(settled.cars[0].exhaust).toBe(false);
    expect(settled.objects).toBe(start.objects);
    expect(errors).toEqual([]);
  });
}

test("mobile race resizes cleanly and reduced motion suppresses decorative movement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const start = await openStage(page, "compact=true&reduced=true");
  await page.evaluate(() => window.raceLab.type(42));
  await page.evaluate(() => window.raceLab.boost());
  const state = await page.evaluate(() => window.raceLab.advance(350));
  expect(state.city).toEqual(start.city);
  state.cars.forEach((car) => {
    expect(car.exhaust).toBe(false);
    expect(car.wheels.every((angle) => angle === 0)).toBe(true);
    expect(car.body).toEqual({ y: 0, angle: 0 });
    expect(car.x).toBeGreaterThanOrEqual(60);
    expect(car.x).toBeLessThanOrEqual(532);
  });
  await page.screenshot({ path: ".local/racing/mobile-reduced.png" });
  const wide = await page.evaluate(() => window.raceLab.resize(960));
  expect(wide.cars[0].x).toBe(225);
  const narrow = await page.evaluate(() => window.raceLab.resize(600));
  expect(narrow.cars[0].x).toBe(150);
});

test("finish sequence celebrates once, cleans up, and freezes the racing result", async ({
  page,
}) => {
  const start = await openStage(page, "distance=300");
  const finished = await page.evaluate(() => window.raceLab.type(100));
  expect(finished.finished).toBe(true);
  expect(finished.place).toBe(1);
  expect(finished.confetti).toBe(24);
  expect(finished.announcement).toBe("FINISH · FIRST PLACE");
  await page.screenshot({ path: ".local/racing/finish.png" });
  const after = await page.evaluate(() => window.raceLab.advance(1800));
  expect(after.position).toBe(finished.position);
  expect(after.place).toBe(finished.place);
  expect(after.confetti).toBe(0);
  expect(after.objects).toBe(start.objects);
  expect(after.tweens).toBe(0);
});
