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
    "game/scenes/HeroFighterArt.ts",
    "game/scenes/PortraitFighter.ts",
    "game/data/fighterRigs.generated.ts",
    "game/scenes/HeroPowerEffects.ts",
    "game/scenes/HeroAttackMotion.ts",
    "game/scenes/EmberAttacks.ts",
    "game/systems/EmberPresentation.ts",
    "game/data/heroStyles.ts",
    "game/data/heroAbilities.ts",
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
  rigs: {
    id: string;
    frames: string[];
    weapon: { x: number; y: number };
    shield: { x: number; y: number };
    shadow: { x: number; y: number };
  }[];
  portraitTextureCount: number;
  renderer: number;
  effects: {
    name: string;
    x: number;
    y: number;
    angle: number;
    scaleX: number;
    scaleY: number;
    alpha: number;
  }[];
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
    joints: { name: string; x: number; y: number; angle: number; scaleX: number; scaleY: number }[];
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
        level?: number,
      ): LabState;
      repeat(slot: number): LabState;
      advance(ms: number): LabState;
      pause(value: boolean): void;
      state(): LabState;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/animation-stage*", (route) =>
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
  for (const [fighter, name] of [
    "ninja",
    "swordsman",
    "hunter",
    "brawler",
    "solar",
    "storm",
    "crystal",
    "ember",
  ].entries()) {
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
          expect(actor.joints).toEqual(initial.actors[index].joints);
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
  for (let fighter = 0; fighter < 8; fighter++)
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

test("hero impacts hold the pose, pause all effects, and resume recovery", async ({ page }) => {
  for (let fighter = 4; fighter < 8; fighter++) {
    const initial = await page.evaluate((fighter) => window.attackLab.play(fighter, 4), fighter);
    const contact = await page.evaluate(
      (ms) => window.attackLab.advance(ms),
      initial.impactMs + 24,
    );
    const held = await page.evaluate(() => window.attackLab.advance(16));
    expect(held.actors[0]).toEqual(contact.actors[0]);
    expect(held.actors[1].x).toBe(contact.actors[1].x);
    expect(held.actors[1].y).toBe(contact.actors[1].y);
    expect(held.damageLabels).toBe(1);
    await page.evaluate(() => window.attackLab.pause(true));
    const paused = await page.evaluate(() => window.attackLab.advance(400));
    expect(paused.actors).toEqual(held.actors);
    expect(paused.effects).toEqual(held.effects);
    await page.evaluate(() => window.attackLab.pause(false));
    const recovered = await page.evaluate((ms) => window.attackLab.advance(ms), initial.durationMs);
    expect(recovered.actors).toEqual(initial.actors);
    expect(recovered.objects).toBe(3);
    expect(recovered.tweens).toBe(0);
  }
});

test("twenty hero attacks keep bounded effects and recover on consecutive casts", async ({
  page,
}) => {
  const report = await page.evaluate(() => {
    let peakObjects = 0,
      peakTweens = 0;
    for (let fighter = 4; fighter < 8; fighter++) {
      const rest = window.attackLab.play(fighter, 0, true);
      for (let slot = 0; slot < 5; slot++) {
        const initial = slot ? window.attackLab.repeat(slot) : rest;
        for (let ms = 0; ms < initial.durationMs + 80; ms += 16) {
          const frame = window.attackLab.advance(16);
          peakObjects = Math.max(peakObjects, frame.objects);
          peakTweens = Math.max(peakTweens, frame.tweens);
          for (const effect of frame.effects) {
            if (
              ![effect.x, effect.y, effect.angle, effect.scaleX, effect.scaleY, effect.alpha].every(
                Number.isFinite,
              )
            )
              throw new Error("Invalid transform: " + effect.name);
          }
        }
        const done = window.attackLab.state();
        if (done.objects !== 3 || done.tweens !== 0)
          throw new Error("Effect leaked after " + fighter + "/" + slot);
        if (JSON.stringify(done.actors) !== JSON.stringify(rest.actors))
          throw new Error("Pose drift after " + fighter + "/" + slot);
      }
    }
    return { peakObjects, peakTweens };
  });
  expect(report.peakObjects).toBeLessThan(85);
  expect(report.peakTweens).toBeLessThan(100);
  test.info().annotations.push({ type: "hero-vfx-budget", description: JSON.stringify(report) });
});

test("all hero attacks also render and clean up in WebGL", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/animation-stage?webgl");
  await page.waitForFunction(() => !!window.attackLab);
  for (let fighter = 4; fighter < 8; fighter++)
    for (let slot = 0; slot < 5; slot++) {
      const initial = await page.evaluate(
        ({ fighter, slot }) => window.attackLab.play(fighter, slot),
        { fighter, slot },
      );
      expect(initial.renderer).toBe(2);
      const contact = await page.evaluate(
        (ms) => window.attackLab.advance(ms),
        initial.impactMs + 32,
      );
      expect(contact.damageLabels).toBe(1);
      expect(contact.effects.length).toBeGreaterThan(0);
      if (slot === 4)
        await page.screenshot({ path: ".local/attacks/hero-webgl-" + fighter + ".png" });
      const done = await page.evaluate((ms) => window.attackLab.advance(ms), initial.durationMs);
      expect(done.objects).toBe(3);
      expect(done.tweens).toBe(0);
      expect(done.actors).toEqual(initial.actors);
    }
  expect(errors).toEqual([]);
});

test("Ember has five distinct attack silhouettes and contact poses", async ({ page }) => {
  const primary = ["fist-jet", "rush-comet", "uppercut-spire", "wings-spread", "heart-phoenix"].map(
    (name) => `hero-ember-${name}`,
  );
  const contacts: string[] = [];
  for (let slot = 0; slot < 5; slot++) {
    const initial = await page.evaluate((slot) => window.attackLab.play(7, slot), slot);
    const strike = await page.evaluate(
      (ms) => window.attackLab.advance(ms),
      initial.impactMs - 100,
    );
    expect(strike.effects.some((effect) => effect.name === primary[slot])).toBe(true);
    expect(strike.effects.filter((effect) => primary.includes(effect.name))).toHaveLength(1);
    await page.screenshot({ path: `.local/attacks/ember-distinct-${slot + 1}.png` });
    const contact = await page.evaluate(() => window.attackLab.advance(124));
    const actor = contact.actors[0];
    contacts.push(
      JSON.stringify([
        Math.round(actor.x),
        Math.round(actor.y),
        Math.round(actor.angle),
        Math.round(actor.armAngle),
      ]),
    );
    expect(contact.damageLabels).toBe(1);
  }
  expect(new Set(contacts).size).toBe(5);
});

test("all five Ember attacks visibly grow with hero level and stay bounded", async ({ page }) => {
  const primary = ["fist-jet", "rush-comet", "uppercut-spire", "wings-spread", "heart-phoenix"].map(
    (name) => `hero-ember-${name}`,
  );
  for (const webgl of [false, true]) {
    if (webgl) {
      await page.goto("/animation-stage?webgl");
      await page.waitForFunction(() => !!window.attackLab);
    }
    for (const reverse of [false, true])
      for (let slot = 0; slot < 5; slot++) {
        let previous = 0;
        for (const level of [1, 5, 20]) {
          const initial = await page.evaluate(
            ({ slot, level, reverse }) =>
              window.attackLab.play(7, slot, true, reverse, false, 100, level),
            { slot, level, reverse },
          );
          const strike = await page.evaluate(
            (ms) => window.attackLab.advance(ms),
            initial.impactMs - 100,
          );
          const effect = strike.effects.find((effect) => effect.name === primary[slot])!;
          expect(effect).toBeDefined();
          const areaScale = Math.abs(effect.scaleX * effect.scaleY);
          if (previous) expect(areaScale).toBeGreaterThan(previous * 1.25);
          previous = areaScale;
          if (!reverse && !webgl)
            await page.screenshot({
              path: `.local/attacks/ember-tier-${slot + 1}-level-${level}.png`,
            });
          const audit = await page.evaluate(
            ({ start, end }) => {
              let objects = 0,
                tweens = 0,
                finite = true;
              for (let ms = start; ms < end; ms += 16) {
                const frame = window.attackLab.advance(16);
                objects = Math.max(objects, frame.objects);
                tweens = Math.max(tweens, frame.tweens);
                finite &&= frame.effects.every((item) =>
                  [item.x, item.y, item.scaleX, item.scaleY, item.alpha].every(Number.isFinite),
                );
              }
              return { objects, tweens, finite, done: window.attackLab.state() };
            },
            { start: initial.impactMs - 100, end: initial.durationMs + 80 },
          );
          expect(audit.objects).toBeLessThan(65);
          expect(audit.tweens).toBeLessThan(70);
          expect(audit.finite).toBe(true);
          expect(audit.done.actors).toEqual(initial.actors);
          expect(audit.done.objects).toBe(3);
          expect(audit.done.tweens).toBe(0);
        }
      }
  }
});

test("portrait artwork and weapon effects remain attached through all forty attacks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 410 });
  const ids = ["ninja", "swordsman", "hunter", "brawler", "solar", "storm", "crystal", "ember"];
  let textureCount = 0;
  for (const reverse of [false, true])
    for (let fighter = 0; fighter < 8; fighter++)
      for (let slot = 0; slot < 5; slot++) {
        const initial = await page.evaluate(
          ({ fighter, slot, reverse }) => window.attackLab.play(fighter, slot, true, reverse),
          { fighter, slot, reverse },
        );
        textureCount ||= initial.portraitTextureCount;
        expect(initial.portraitTextureCount).toBe(textureCount);
        expect(initial.rigs[0].id).toBe(ids[fighter]);
        expect(initial.rigs[0].frames.length).toBeGreaterThanOrEqual(4);
        expect(initial.rigs[0].frames.every((frame) => frame.startsWith(ids[fighter] + "/"))).toBe(
          true,
        );
        const audit = await page.evaluate(
          ({ duration, impact }) => {
            let glowError = 0,
              shadowError = 0,
              finite = true;
            for (let ms = 0; ms < duration + 160; ms += 16) {
              const state = window.attackLab.advance(16),
                rig = state.rigs[0];
              const points = [rig.weapon, rig.shadow, rig.shield];
              finite &&= points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
              shadowError = Math.max(shadowError, Math.abs(rig.shadow.y - 321));
              if (ms < impact - 32)
                for (const glow of state.effects.filter(
                  (effect) => effect.name === "hero-weapon-glow",
                )) {
                  glowError = Math.max(
                    glowError,
                    Math.min(
                      Math.hypot(glow.x - rig.weapon.x, glow.y - rig.weapon.y),
                      Math.hypot(glow.x - rig.shield.x, glow.y - rig.shield.y),
                    ),
                  );
                }
            }
            // Existing villain damage labels can outlive the attack recovery.
            return { glowError, shadowError, finite, state: window.attackLab.advance(800) };
          },
          { duration: initial.durationMs, impact: initial.impactMs },
        );
        expect(audit.finite).toBe(true);
        expect(audit.shadowError).toBeLessThan(0.01);
        expect(
          audit.glowError,
          `${ids[fighter]} attack ${slot + 1}, mirrored ${reverse}`,
        ).toBeLessThan(1);
        expect(audit.state.portraitTextureCount).toBe(textureCount);
        expect(audit.state.actors).toEqual(initial.actors);
        if (slot === 0 && !reverse) {
          const gallery = await page.evaluate(
            (fighter) => window.attackLab.play(fighter, 0),
            fighter,
          );
          await page.evaluate((ms) => window.attackLab.advance(ms), gallery.durationMs + 160);
          await page.screenshot({ path: ".local/attacks/portrait-idle-" + ids[fighter] + ".png" });
        }
      }
});
