import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();
const scratch = path.join(root, ".local", "animation-stage");
let bundle: Buffer;

test.beforeAll(async () => {
  const sources = [
    "e2e/fixtures/animation-stage.ts",
    "game/scenes/AttackAnimator.ts",
    "game/scenes/AttackVfx.ts",
    "game/scenes/PowerEffects.ts",
    "game/scenes/FighterMotion.ts",
    "game/scenes/FighterArt.ts",
    "game/scenes/BoxerRig.ts",
    "game/scenes/CelestialTempest.ts",
    "game/scenes/BoxingAnimator.ts",
    "game/data/characters.ts",
    "game/data/abilities.ts",
    "game/systems/AttackPresentation.ts",
    "lib/scoring.ts",
  ];
  for (const file of sources) {
    const destination = path.join(scratch, file.replace(/\.ts$/, ".js"));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(
      destination,
      ts.transpileModule(await readFile(path.join(root, file), "utf8"), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
      }).outputText,
    );
  }
  // Reuse Next's bundled compiler; this test adds no runtime or app dependencies.
  const { webpack } = require("next/dist/compiled/webpack/webpack");
  await new Promise<void>((resolve, reject) =>
    webpack(
      {
        mode: "development",
        devtool: false,
        context: root,
        entry: path.join(scratch, "e2e/fixtures/animation-stage.js"),
        output: { path: scratch, filename: "stage.js" },
        resolve: {
          alias: { "@": scratch },
          extensions: [".js"],
          modules: [path.join(root, "node_modules")],
        },
      },
      (error: Error | null, stats: { hasErrors(): boolean; toString(): string }) => {
        if (error || stats.hasErrors()) reject(error || new Error(stats.toString()));
        else resolve();
      },
    ),
  );
  bundle = await readFile(path.join(scratch, "stage.js"));
});

type LabState = {
  impactMs: number;
  durationMs: number;
  objects: number;
  tweens: number;
  damageLabels: number;
  actors: {
    x: number;
    y: number;
    angle: number;
    alpha: number;
    scaleX: number;
    scaleY: number;
    armAngle: number;
  }[];
  summons: { x: number; y: number; scaleX: number; scaleY: number }[];
};
declare global {
  interface Window {
    attackLab: {
      play(
        fighter: number,
        slot: number,
        compact?: boolean,
        reverse?: boolean,
        reduced?: boolean,
        quality?: number,
      ): LabState;
      advance(ms: number): LabState;
      pause(value: boolean): void;
      state(): LabState;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/animation-stage", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html><head><meta charset="utf-8"></head><body style="margin:0;background:#101525"><div id="stage"></div><script src="/stage.js"></script></body></html>',
    }),
  );
  await page.route("**/stage.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.goto("/animation-stage");
  await page.waitForFunction(() => !!window.attackLab);
});

for (const compact of [false, true]) {
  for (const [fighter, name] of ["ninja", "swordsman", "hunter", "brawler"].entries()) {
    test(`${name}: all five attacks render and recover (${compact ? "mobile" : "desktop"})`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: compact ? 390 : 1000, height: compact ? 844 : 500 });
      for (let slot = 0; slot < 5; slot++) {
        const initial = await page.evaluate(
          ({ fighter, slot, compact }) => window.attackLab.play(fighter, slot, compact),
          { fighter, slot, compact },
        );
        const before = await page.evaluate(
          (ms) => window.attackLab.advance(ms),
          initial.impactMs - 64,
        );
        expect(before.damageLabels).toBe(0);
        await page.screenshot({
          path: `.local/attacks/${name}-${slot + 1}-${compact ? "mobile" : "desktop"}-strike.png`,
        });
        const hit = await page.evaluate(() => window.attackLab.advance(128));
        expect(hit.damageLabels).toBe(1);
        await page.screenshot({
          path: `.local/attacks/${name}-${slot + 1}-${compact ? "mobile" : "desktop"}-impact.png`,
        });
        const done = await page.evaluate((ms) => window.attackLab.advance(ms), initial.durationMs);
        expect(done.objects).toBe(3); // backdrop plus the two fighters; no abandoned effects.
        expect(done.tweens).toBe(0);
        for (const [index, actor] of done.actors.entries()) {
          expect(actor.x).toBeCloseTo(initial.actors[index].x);
          expect(actor.y).toBe(278);
          expect(actor.angle).toBe(0);
          expect(actor.armAngle).toBe(0);
          expect(actor.alpha).toBe(1);
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test("summons retain proportions, distinct slots and pause with the scene", async ({ page }) => {
  for (const compact of [false, true]) {
    for (const [fighter, slot] of [
      [0, 1],
      [0, 2],
      [0, 4],
      [2, 3],
      [2, 4],
    ]) {
      await page.evaluate(
        ({ fighter, slot, compact }) => window.attackLab.play(fighter, slot, compact),
        { fighter, slot, compact },
      );
      const formed = await page.evaluate(() => window.attackLab.advance(450));
      expect(formed.summons.length).toBeGreaterThan(1);
      expect(
        new Set(formed.summons.map((shade) => `${Math.round(shade.x)},${Math.round(shade.y)}`))
          .size,
      ).toBe(formed.summons.length);
      formed.summons.forEach((shade) => expect(Math.abs(shade.scaleX)).toBeCloseTo(shade.scaleY));
      await page.screenshot({ path: `.local/attacks/formation-${fighter}-${slot}-${compact}.png` });
      await page.evaluate(() => window.attackLab.pause(true));
      const frozen = await page.evaluate(() => window.attackLab.advance(400));
      expect(frozen.actors).toEqual(formed.actors);
      expect(frozen.summons).toEqual(formed.summons);
      await page.evaluate(() => window.attackLab.pause(false));
      const done = await page.evaluate(() => window.attackLab.advance(4000));
      expect(done.objects).toBe(3);
    }
  }
});

test("every attack supports the opposite direction and reduced motion", async ({ page }) => {
  for (let fighter = 0; fighter < 4; fighter++)
    for (let slot = 0; slot < 5; slot++) {
      for (const reduced of [false, true]) {
        const initial = await page.evaluate(
          ({ fighter, slot, reduced }) =>
            window.attackLab.play(fighter, slot, true, true, reduced, 50),
          { fighter, slot, reduced },
        );
        const middle = await page.evaluate(
          (ms) => window.attackLab.advance(ms),
          initial.impactMs / 2,
        );
        if (reduced) expect(middle.actors).toEqual(initial.actors);
        const done = await page.evaluate(
          (ms) => window.attackLab.advance(ms),
          initial.durationMs + 500,
        );
        expect(done.objects).toBe(3);
        expect(done.tweens).toBe(0);
        expect(done.actors[0].x).toBe(initial.actors[0].x);
      }
    }
});
