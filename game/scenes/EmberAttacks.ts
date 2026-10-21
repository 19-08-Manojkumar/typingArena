import { makePortraitFighter } from "@/game/scenes/PortraitFighter";
import { fighterSocket } from "@/game/scenes/PortraitFighter";
import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { AttackVfx } from "@/game/scenes/AttackVfx";
import { heroHitStop } from "@/game/scenes/HeroAttackMotion";
import { emberPresentation } from "@/game/systems/EmberPresentation";

type Actor = Phaser.GameObjects.Container;
type Art = Phaser.GameObjects.Graphics;
type Pose = {
  x: number;
  y: number;
  tilt: number;
  arm: number;
  rear: number;
  reach: number;
  step: number;
  cape: number;
};
type Frame = { at: number; pose: Pose; ease?: "in" | "out" };
const idle: Pose = { x: 0, y: 0, tilt: 0, arm: 0, rear: 0, reach: 0, step: 0, cape: 0 };
const pose = (values: Partial<Pose>): Pose => ({ ...idle, ...values });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Five independent Ember silhouettes, with bounded vector art and the existing scene clock. */
export class EmberAttacks {
  private vfx: AttackVfx;
  constructor(private scene: Phaser.Scene) {
    this.vfx = new AttackVfx(scene);
  }

  play(source: Actor, target: Actor, color: number, plan: AttackPresentation) {
    this.motion(source, target, plan);
    const { size } = emberPresentation(plan);
    switch (plan.abilityId) {
      case "ember-fist":
        this.fist(source, target, color, plan, size);
        break;
      case "phoenix-rush":
        this.rush(source, target, color, plan, size);
        break;
      case "blazing-uppercut":
        this.uppercut(source, target, color, plan, size);
        break;
      case "phoenix-wings":
        this.wings(source, target, color, plan, size);
        break;
      case "phoenix-heart":
        this.heart(source, target, color, plan, size);
        break;
    }
  }

  private motion(source: Actor, target: Actor, p: AttackPresentation) {
    const { growth } = emberPresentation(p);
    const d = source.scaleX < 0 ? -1 : 1;
    const home = { x: source.x, y: source.y, angle: source.angle };
    const shadow = source.getByName("hero-shadow") as Art | null;
    const names = ["lead-arm", "rear-arm", "hero-lead-leg", "hero-rear-leg", "hero-cape"];
    const joints = names.map((name) => source.getByName(name) as Actor);
    const rests = joints.map((joint) => ({ x: joint.x, y: joint.y, angle: joint.angle }));
    const distance = Math.abs(target.x - source.x);
    const hit = p.impactMs;
    let frames: Frame[];
    switch (p.abilityId) {
      case "ember-fist":
        frames = [
          { at: 0, pose: idle },
          {
            at: hit - 135,
            pose: pose({ x: -16 * growth, y: 4, tilt: -12, arm: 48, rear: -35, step: -12 }),
          },
          {
            at: hit - 65,
            ease: "out",
            pose: pose({
              x: Math.max(0, distance - 190),
              y: -7,
              tilt: 6,
              arm: 19,
              rear: -42,
              reach: 8,
              step: 25,
              cape: -27,
            }),
          },
          {
            at: hit,
            ease: "in",
            pose: pose({
              x: Math.max(0, distance - 83),
              tilt: 10,
              arm: -5,
              rear: -40,
              reach: 20,
              step: 18,
              cape: -18,
            }),
          },
        ];
        break;
      case "phoenix-rush":
        frames = [
          { at: 0, pose: idle },
          {
            at: 200,
            pose: pose({
              x: -24 * growth,
              y: 17,
              tilt: -22,
              arm: 63,
              rear: -70,
              step: -28,
              cape: 14,
            }),
          },
          {
            at: hit - 320,
            pose: pose({
              x: -28 * growth,
              y: 14,
              tilt: -19,
              arm: 52,
              rear: -70,
              step: -30,
              cape: 20,
            }),
          },
          {
            at: hit - 120,
            ease: "out",
            pose: pose({
              x: Math.max(0, distance - 160),
              y: -7,
              tilt: 27,
              arm: 30,
              rear: -95,
              step: 31,
              cape: -48,
            }),
          },
          {
            at: hit,
            pose: pose({
              x: Math.max(0, distance - 70),
              y: 5,
              tilt: 26,
              arm: 27,
              rear: -105,
              step: 28,
              cape: -48,
            }),
          },
        ];
        break;
      case "blazing-uppercut":
        frames = [
          { at: 0, pose: idle },
          {
            at: 220,
            pose: pose({ x: -16, y: 23, tilt: -19, arm: 88, rear: -35, step: -24, cape: 15 }),
          },
          {
            at: hit - 360,
            pose: pose({ x: -16, y: 25, tilt: -21, arm: 94, rear: -38, step: -26, cape: 20 }),
          },
          {
            at: hit - 170,
            ease: "out",
            pose: pose({
              x: Math.max(0, distance - 90),
              y: 13,
              tilt: -8,
              arm: 34,
              rear: -40,
              step: -18,
              cape: -30,
            }),
          },
          {
            at: hit,
            ease: "out",
            pose: pose({
              x: Math.max(0, distance - 60),
              y: -34 * growth,
              tilt: 9,
              arm: -72,
              rear: -24,
              reach: 18,
              step: -30,
              cape: -35,
            }),
          },
        ];
        break;
      case "phoenix-wings":
        frames = [
          { at: 0, pose: idle },
          {
            at: 250,
            pose: pose({ x: -8, y: 9, tilt: -6, arm: 64, rear: -70, step: -12, cape: 12 }),
          },
          {
            at: hit - 520,
            pose: pose({
              x: 6,
              y: -19 * growth,
              tilt: -2,
              arm: -104,
              rear: -130,
              step: 6,
              cape: -18,
            }),
          },
          {
            at: hit - 240,
            ease: "out",
            pose: pose({
              x: 20,
              y: -13 * growth,
              tilt: 2,
              arm: -8,
              rear: 62,
              reach: 14,
              step: 13,
              cape: -16,
            }),
          },
          {
            at: hit,
            pose: pose({
              x: 20,
              y: -13 * growth,
              tilt: 2,
              arm: -8,
              rear: 62,
              reach: 14,
              step: 13,
              cape: -16,
            }),
          },
        ];
        break;
      default:
        frames = [
          { at: 0, pose: idle },
          {
            at: 320,
            pose: pose({ x: -10, y: 24, tilt: -11, arm: 62, rear: -80, step: -24, cape: 15 }),
          },
          {
            at: hit - 1100,
            pose: pose({ x: 6, y: -14, tilt: -5, arm: -105, rear: -120, step: -6, cape: -22 }),
          },
          {
            at: hit - 560,
            pose: pose({
              x: 16,
              y: -42 * growth,
              tilt: -4,
              arm: -128,
              rear: -100,
              step: 16,
              cape: -35,
            }),
          },
          {
            at: hit - 170,
            pose: pose({
              x: 20,
              y: -48 * growth,
              tilt: 4,
              arm: -125,
              rear: -95,
              step: 20,
              cape: -40,
            }),
          },
          {
            at: hit,
            ease: "in",
            pose: pose({
              x: 28,
              y: 16,
              tilt: 20,
              arm: 72,
              rear: -20,
              reach: 8,
              step: -28,
              cape: 14,
            }),
          },
        ];
        break;
    }
    const contact = frames[frames.length - 1].pose;
    frames.push({ at: hit + heroHitStop(p), pose: contact });
    if (p.abilityId === "blazing-uppercut")
      frames.push({
        at: hit + 260,
        pose: pose({
          x: Math.max(0, distance - 130),
          y: 9,
          tilt: 8,
          arm: -20,
          rear: -30,
          step: -18,
          cape: 20,
        }),
      });
    frames.push({
      at: Math.min(p.durationMs - 70, hit + (p.tier === "finisher" ? 620 : 460)),
      pose: idle,
    });
    const restore = () => {
      if (!source.active) return;
      source.setPosition(home.x, home.y).setAngle(home.angle);
      shadow?.setPosition(0, 0).setAngle(0);
      joints.forEach((joint, i) =>
        joint.setPosition(rests[i].x, rests[i].y).setAngle(rests[i].angle),
      );
    };
    this.scene.tweens.addCounter({
      from: 0,
      to: p.durationMs - 40,
      duration: p.durationMs - 40,
      onUpdate: (tween) => {
        if (!source.active) return;
        const ms = Number(tween.getValue());
        const index = frames.findIndex((frame) => frame.at > ms);
        const b = frames[index < 0 ? frames.length - 1 : index];
        const a = frames[index <= 0 ? frames.length - 1 : index - 1];
        const t = a === b ? 1 : Math.min(1, (ms - a.at) / Math.max(1, b.at - a.at));
        const eased =
          b.ease === "in" ? t * t : b.ease === "out" ? 1 - (1 - t) ** 3 : t * t * (3 - 2 * t);
        const value = (key: keyof Pose) => lerp(a.pose[key], b.pose[key], eased);
        source
          .setPosition(home.x + d * value("x"), home.y + value("y"))
          .setAngle(home.angle + d * value("tilt"));
        const preparing = ms > 130 && ms < hit - 380;
        const breath = preparing
          ? Math.min(1, (ms - 130) / 120) * Math.min(1, (hit - 380 - ms) / 180) * Math.sin(ms / 110)
          : 0;
        source.y += breath * 2.5;
        if (shadow) {
          const anchor = source.getWorldTransformMatrix().applyInverse(source.x, home.y + 43);
          const rotation = -d * source.rotation;
          shadow
            .setPosition(anchor.x + 43 * Math.sin(rotation), anchor.y - 43 * Math.cos(rotation))
            .setRotation(rotation);
        }
        joints[0]
          .setPosition(rests[0].x + value("reach"), rests[0].y)
          .setAngle(rests[0].angle + value("arm"));
        joints[1].angle = rests[1].angle + value("rear");
        joints[2].angle = rests[2].angle - value("step");
        joints[3].angle = rests[3].angle + value("step") * 0.7;
        joints[4].angle = rests[4].angle + value("cape") + breath * 5;
      },
      onComplete: restore,
    });
  }

  private art(x: number, y: number, kind: string, size = 1, depth = 8) {
    return this.vfx.art(x, y, depth).setName(`hero-ember-${kind}`).setScale(size);
  }

  private point(source: Actor) {
    return fighterSocket(source, "lead-hand");
  }

  private run(duration: number, update: (t: number) => void, complete?: () => void) {
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: (tween) => update(Number(tween.getValue())),
      onComplete: complete,
    });
  }

  private fist(source: Actor, target: Actor, color: number, p: AttackPresentation, size: number) {
    const d = source.scaleX < 0 ? -1 : 1;
    this.vfx.after(p.impactMs - 140, () => {
      const hand = this.point(source);
      const jet = this.art(hand.x, hand.y, "fist-jet", size).setScale(d * size, size);
      jet.fillStyle(0xff6e24, 0.3).fillTriangle(-65, -18, 20, 0, -65, 18);
      jet.fillStyle(color, 0.85).fillRoundedRect(-11, -15, 38, 30, 8);
      jet.fillStyle(0xfff4c5, 0.95).fillRoundedRect(8, -10, 24, 21, 5);
      for (let i = 0; i < 3; i++)
        jet.lineStyle(1.5, 0xff7c30).lineBetween(12 + i * 6, -9, 12 + i * 6, -1);
      this.run(
        225,
        (t) => {
          const point = this.point(source);
          jet.setPosition(point.x, point.y).setAlpha(t < 0.65 ? 1 : (1 - t) / 0.35);
        },
        () => jet.destroy(),
      );
    });
    this.vfx.after(p.impactMs, () => {
      const flare = this.art(target.x, 224, "fist-impact", size).setScale(d * size, size);
      flare.fillStyle(0xfff2ba, 0.95).fillTriangle(-18, -7, 44, 0, -18, 7);
      flare.lineStyle(3, color, 0.8).lineBetween(-6, -18, 23, -10).lineBetween(-6, 18, 23, 10);
      this.scene.tweens.add({
        targets: flare,
        scaleX: d * size * 1.4,
        alpha: 0,
        duration: 230,
        ease: "Cubic.easeOut",
        onComplete: () => flare.destroy(),
      });
      this.sparks(target.x, 224, color, size, 5, 190);
    });
  }

  private rush(source: Actor, target: Actor, color: number, p: AttackPresentation, size: number) {
    const d = source.scaleX < 0 ? -1 : 1;
    const home = source.x;
    this.vfx.after(p.impactMs - 320, () => {
      const wake = this.art(home, 262, "rush-comet", size, 4).setScale(d * size, size);
      // A horizontal flame envelope is exclusive to the dash, clearly different from the fist.
      wake.fillStyle(0xf15318, 0.25).fillPoints(
        [
          { x: -138, y: 0 },
          { x: -67, y: -13 },
          { x: -106, y: -30 },
          { x: 26, y: -26 },
          { x: 68, y: 0 },
          { x: 24, y: 29 },
          { x: -103, y: 32 },
          { x: -62, y: 14 },
        ],
        true,
      );
      wake.fillStyle(color, 0.55).fillPoints(
        [
          { x: -96, y: 0 },
          { x: -28, y: -12 },
          { x: 34, y: -23 },
          { x: 62, y: 0 },
          { x: 30, y: 19 },
          { x: -49, y: 12 },
        ],
        true,
      );
      wake.lineStyle(3, 0xffefb3, 0.85).beginPath().arc(24, 0, 31, -1.25, 1.25).strokePath();
      this.run(
        405,
        (t) =>
          wake
            .setPosition(source.x + d * 47, source.y - 46)
            .setAlpha(t < 0.79 ? 1 : (1 - t) / 0.21),
        () => wake.destroy(),
      );
      for (let i = 0; i < 4; i++)
        this.vfx.after(40 + i * 60, () => {
          const ghost = makePortraitFighter(
            this.scene,
            source.x - d * 17,
            false,
            "ember",
            true,
            color,
          )
            .setPosition(source.x - d * 17, source.y)
            .setAngle(source.angle)
            .setScale(source.scaleX, source.scaleY)
            .setAlpha(0.16)
            .setDepth(4)
            .setName("hero-ember-rush-afterimage");
          for (const child of source.list) {
            const original = child as Actor,
              copy = ghost.getByName(child.name) as Actor | null;
            if (copy && child.name !== "hero-shadow")
              copy.setPosition(original.x, original.y).setAngle(original.angle);
          }
          (ghost.getByName("hero-shadow") as Art).setVisible(false);
          this.vfx.fade(ghost, 150);
        });
    });
    this.vfx.after(p.impactMs, () => {
      const plow = this.art(target.x, 245, "rush-impact", size).setScale(d * size, size);
      plow.fillStyle(0xff8c35, 0.65).fillTriangle(-50, -35, 77, 0, -50, 35);
      plow.lineStyle(4, 0xfff0b8, 0.9).beginPath().arc(3, 0, 43, -1.2, 1.2).strokePath();
      this.scene.tweens.add({
        targets: plow,
        x: target.x + d * 28,
        scaleX: d * size * 1.35,
        alpha: 0,
        duration: 300,
        ease: "Cubic.easeOut",
        onComplete: () => plow.destroy(),
      });
      this.ground(target.x - d * 30, color, size, 65);
      this.sparks(target.x, 244, color, size, 7, 260, d);
    });
  }

  private uppercut(
    source: Actor,
    target: Actor,
    color: number,
    p: AttackPresentation,
    size: number,
  ) {
    const hit = target.x;
    this.vfx.after(p.impactMs - 330, () => {
      const pillar = this.art(hit, 319, "uppercut-spire", size).setScale(size * 0.45, 0.02);
      pillar.fillStyle(0xf4521e, 0.3).fillPoints(
        [
          { x: -34, y: 0 },
          { x: -25, y: -61 },
          { x: -39, y: -106 },
          { x: -13, y: -91 },
          { x: 2, y: -151 },
          { x: 18, y: -111 },
          { x: 35, y: -134 },
          { x: 28, y: -62 },
          { x: 38, y: 0 },
        ],
        true,
      );
      pillar.fillStyle(color, 0.68).fillTriangle(-21, 0, 4, -143, 23, 0);
      pillar.fillStyle(0xfff5c8, 0.9).fillTriangle(-7, 0, 4, -120, 12, 0);
      const spiral = this.art(hit, 319, "uppercut-spiral", size);
      this.run(
        600,
        (t) => {
          const rise = Math.min(1, t / 0.55);
          pillar
            .setScale(size * (0.45 + rise * 0.55), size * rise)
            .setAlpha(t < 0.65 ? 1 : (1 - t) / 0.35);
          spiral.clear().setAlpha(t < 0.65 ? 1 : (1 - t) / 0.35);
          for (let i = 0; i < 3; i++) {
            const a = rise * Math.PI * 3 + i * 1.5;
            const points = Array.from({ length: 18 }, (_, j) => ({
              x: Math.cos(a + j * 0.17) * (34 - j * 0.4),
              y: -rise * 116 - i * 13 + Math.sin(a + j * 0.17) * 13 + j * 1.6,
            }));
            spiral
              .lineStyle(i === 1 ? 4 : 2, i === 1 ? 0xfff1c0 : color, 0.85)
              .strokePoints(points, false);
          }
        },
        () => {
          pillar.destroy();
          spiral.destroy();
        },
      );
    });
    this.vfx.after(p.impactMs, () => {
      this.ground(hit, color, size, 45);
      this.sparks(hit, 207, color, size, 9, 340, 0, true);
    });
  }

  private wing(art: Art, side: number, color: number) {
    art.fillStyle(0xe95b21, 0.22).fillPoints(
      [
        { x: 0, y: 6 },
        { x: side * 35, y: -46 },
        { x: side * 81, y: -72 },
        { x: side * 72, y: 5 },
        { x: side * 21, y: 26 },
      ],
      true,
    );
    art.fillStyle(color, 0.72).fillPoints(
      [
        { x: 0, y: 5 },
        { x: side * 24, y: -28 },
        { x: side * 80, y: -66 },
        { x: side * 61, y: -24 },
        { x: side * 80, y: -34 },
        { x: side * 58, y: 1 },
        { x: side * 68, y: -5 },
        { x: side * 38, y: 24 },
        { x: side * 12, y: 21 },
      ],
      true,
    );
    art.lineStyle(2, 0xfff0b7, 0.9).lineBetween(side * 8, 7, side * 67, -48);
    for (let i = 0; i < 3; i++)
      art
        .lineStyle(1, 0xffedac, 0.65)
        .lineBetween(side * (16 + i * 9), 5 + i * 3, side * (66 - i * 7), -33 + i * 15);
  }

  private wings(source: Actor, target: Actor, color: number, p: AttackPresentation, size: number) {
    const d = source.scaleX < 0 ? -1 : 1;
    const start = p.impactMs - 650;
    this.vfx.after(start, () => {
      const wings = this.scene.add
        .container(source.x, source.y - 68)
        .setDepth(4)
        .setName("hero-ember-wings-spread")
        .setScale(size * 0.05);
      const pair = [-1, 1].map((side) => {
        const art = this.vfx.art(0, 0);
        this.wing(art, side, color);
        return art;
      });
      wings.add(pair);
      this.run(
        1070,
        (t) => {
          const spread = Math.min(1, t / 0.26);
          wings
            .setPosition(source.x, source.y - 69)
            .setScale(size * spread)
            .setAlpha(t < 0.72 ? 1 : (1 - t) / 0.28);
          pair[0].angle = -17 * (1 - spread) + Math.sin(t * Math.PI * 5) * 12;
          pair[1].angle = 17 * (1 - spread) - Math.sin(t * Math.PI) * 8;
        },
        () => wings.destroy(),
      );
      for (const side of [-1, 1])
        this.vfx.after(260, () => {
          const origin = { x: source.x + d * 25, y: source.y - 59 };
          const crescent = this.art(
            origin.x,
            origin.y,
            side < 0 ? "wings-high-crescent" : "wings-low-crescent",
            size,
          ).setScale(d * size, size);
          crescent
            .lineStyle(14, 0xf26825, 0.18)
            .beginPath()
            .arc(0, 0, 35, -1.15, 1.15)
            .strokePath();
          crescent.lineStyle(7, color, 0.85).beginPath().arc(0, 0, 35, -1.15, 1.15).strokePath();
          crescent.lineStyle(2, 0xfff2c7).beginPath().arc(0, 0, 39, -1.1, 1.1).strokePath();
          this.run(
            390,
            (t) =>
              crescent
                .setPosition(
                  lerp(origin.x, target.x - d * 15, t),
                  lerp(origin.y, 227 + side * 16, t) + side * Math.sin(t * Math.PI) * 51,
                )
                .setAngle(d * side * (1 - t) * 24),
            () => this.vfx.fade(crescent, 240),
          );
        });
    });
    this.vfx.after(p.impactMs, () => {
      for (const side of [-1, 1]) {
        const feather = this.art(target.x, 225, "wings-impact-feathers", size)
          .setAngle(d * side * 24)
          .setScale(d * size, size);
        feather.fillStyle(color, 0.6).fillPoints(
          [
            { x: -55, y: side * 9 },
            { x: 0, y: side * 31 },
            { x: 67, y: side * 14 },
            { x: 23, y: 0 },
          ],
          true,
        );
        feather.lineStyle(2, 0xffefb7, 0.85).lineBetween(-42, side * 11, 55, side * 14);
        this.scene.tweens.add({
          targets: feather,
          y: 225 + side * 34,
          alpha: 0,
          duration: 380,
          ease: "Cubic.easeOut",
          onComplete: () => feather.destroy(),
        });
      }
      this.sparks(target.x, 225, color, size, 10, 360);
    });
  }

  private heart(source: Actor, target: Actor, color: number, p: AttackPresentation, size: number) {
    const centre = (source.x + target.x) / 2;
    const d = source.scaleX < 0 ? -1 : 1;
    this.vfx.after(160, () => {
      const core = this.art(source.x, 227, "heart-core", size).setScale(size * 0.1);
      core.fillStyle(0xf25720, 0.18).fillCircle(0, 0, 36);
      core.fillStyle(color, 0.6).fillEllipse(0, 0, 38, 49);
      core.fillStyle(0xfff4bf, 0.9).fillEllipse(0, 0, 17, 28);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        core
          .lineStyle(2, color, 0.6)
          .lineBetween(Math.cos(a) * 24, Math.sin(a) * 29, Math.cos(a) * 34, Math.sin(a) * 40);
      }
      this.run(
        720,
        (t) =>
          core
            .setPosition(source.x + d * 12, source.y - 53 - t * 24)
            .setScale(size * (0.15 + t * 0.6))
            .setRotation(t * 0.5),
        () => this.vfx.fade(core, 180),
      );
    });
    this.vfx.after(760, () => {
      const bird = this.scene.add
        .container(centre, 174)
        .setDepth(7)
        .setName("hero-ember-heart-phoenix")
        .setScale(size * 0.1)
        .setAlpha(0);
      const pair = [-1, 1].map((side) => {
        const art = this.vfx.art(0, 0);
        this.wing(art, side, color);
        return art;
      });
      const body = this.vfx.art(0, 0);
      body.fillStyle(0xffefb1, 0.95).fillPoints(
        [
          { x: 0, y: -39 },
          { x: 10, y: -26 },
          { x: 22, y: -21 },
          { x: 7, y: -15 },
          { x: 15, y: 10 },
          { x: 0, y: 49 },
          { x: -14, y: 9 },
          { x: -7, y: -18 },
        ],
        true,
      );
      body
        .fillStyle(color, 0.75)
        .fillTriangle(-10, 27, -23, 78, 3, 44)
        .fillTriangle(10, 27, 25, 73, -3, 44);
      body.lineStyle(2, 0xfff4c4, 0.9).lineBetween(0, 36, 0, 81);
      bird.add([...pair, body]);
      const launch = p.impactMs - 480;
      this.run(
        p.impactMs - 760 + 100,
        (t) => {
          const ms = 760 + t * (p.impactMs - 760 + 100);
          const emerge = Math.min(1, (ms - 760) / 450);
          const dive = Math.min(1, Math.max(0, (ms - launch) / 480));
          bird
            .setPosition(
              lerp(centre, target.x, dive * dive),
              167 - Math.sin(dive * Math.PI) * 27 + dive * 64,
            )
            .setScale(size * emerge * (1 - dive * 0.25))
            .setAlpha(emerge * (ms > p.impactMs ? 1 - (ms - p.impactMs) / 100 : 1));
          bird.angle = d * dive * 125;
          pair.forEach(
            (wing, i) => (wing.angle = (i ? -1 : 1) * (Math.sin(ms / 145) * 9 - dive * 19)),
          );
        },
        () => bird.destroy(),
      );
    });
    this.vfx.after(p.impactMs, () => {
      const nova = this.art(target.x, 231, "heart-nova", size).setScale(size * 0.15);
      nova.fillStyle(0xf1521c, 0.12).fillCircle(0, 0, 66);
      nova.fillStyle(color, 0.28).fillCircle(0, 0, 48);
      nova.fillStyle(0xffefb9, 0.85).fillCircle(0, 0, 23);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        nova
          .fillStyle(i % 2 ? color : 0xffd27a, 0.7)
          .fillTriangle(
            Math.cos(a - 0.06) * 27,
            Math.sin(a - 0.06) * 27,
            Math.cos(a) * 64,
            Math.sin(a) * 64,
            Math.cos(a + 0.06) * 27,
            Math.sin(a + 0.06) * 27,
          );
      }
      this.scene.tweens.add({
        targets: nova,
        scale: size,
        alpha: 0,
        duration: 470,
        ease: "Cubic.easeOut",
        onComplete: () => nova.destroy(),
      });
      this.ground(target.x, color, size, 65);
      this.sparks(target.x, 231, color, size, 12, 470);
    });
  }

  private ground(x: number, color: number, size: number, radius: number) {
    const ring = this.art(x, 319, "ground-wave", size, 3).setScale(size * 0.15);
    ring.lineStyle(2.5, color, 0.8).strokeEllipse(0, 0, radius * 2, radius * 0.38);
    ring.lineStyle(1, 0xfff2bc, 0.6).strokeEllipse(0, 0, radius * 1.65, radius * 0.27);
    this.scene.tweens.add({
      targets: ring,
      scale: size,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private sparks(
    x: number,
    y: number,
    color: number,
    size: number,
    count: number,
    duration: number,
    direction = 0,
    upward = false,
  ) {
    for (let i = 0; i < count; i++) {
      const a = upward ? -Math.PI * (0.15 + (i / count) * 0.7) : i * 2.39996;
      const spark = this.art(x, y, "spark", size);
      spark.fillStyle(i % 3 ? color : 0xfff4cb, 0.9).fillTriangle(-2, 3, 0, -7, 3, 2);
      this.scene.tweens.add({
        targets: spark,
        x: x + (Math.cos(a) * 39 + direction * 32) * size,
        y: y + Math.sin(a) * (upward ? 64 : 36) * size - 8,
        angle: i * 47,
        alpha: 0,
        duration,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }
}
