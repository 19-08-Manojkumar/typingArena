import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import {
  heroCinematicMoves,
  heroCinematicPresentation,
} from "@/game/systems/HeroCinematicPresentation";
import { AttackVfx } from "@/game/scenes/AttackVfx";
import { fighterSocket, makePortraitFighter } from "@/game/scenes/PortraitFighter";
import type { HeroId } from "@/game/data/heroStyles";

type Actor = Phaser.GameObjects.Container;
type Art = Phaser.GameObjects.Graphics;
type Point = { x: number; y: number };
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const mix = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Three batched vector layers at most; atlas echoes reuse the approved character artwork. */
export class HeroCinematics {
  private vfx: AttackVfx;
  constructor(private scene: Phaser.Scene) {
    this.vfx = new AttackVfx(scene);
  }

  play(source: Actor, target: Actor, color: number, p: AttackPresentation) {
    const spec = heroCinematicMoves[p.abilityId as keyof typeof heroCinematicMoves];
    if (!spec) return;
    const { rank, size } = heroCinematicPresentation(p),
      d = source.scaleX < 0 ? -1 : 1;
    const release = Math.max(45, p.impactMs - spec.flight),
      end = Math.min(p.durationMs - 70, p.impactMs + 510);
    const art = this.vfx
      .art(source.x, source.y - 66, 4)
      .setName(`hero-cinematic-${p.abilityId}`)
      .setScale(d * size, size);
    const wake = this.vfx.art(0, 0, 7).setName("hero-cinematic-weapon-wake");
    const history: Point[] = [];
    this.scene.tweens.addCounter({
      from: 0,
      to: end,
      duration: end,
      onUpdate: (tween) => {
        if (!source.active || !target.active) return;
        const ms = Number(tween.getValue());
        const charge = smooth(ms / release),
          flight = clamp((ms - release) / spec.flight),
          after = clamp((ms - p.impactMs) / (end - p.impactMs));
        art
          .setPosition(source.x, source.y - 66)
          .setAlpha(ms < p.impactMs ? 1 : 1 - smooth(after))
          .clear();
        const local = (point: Point): Point => ({
          x: (point.x - art.x) / (d * size),
          y: (point.y - art.y) / size,
        });
        const hand = local(
          fighterSocket(source, p.abilityId === "aegis-charge" ? "shield-core" : "weapon-tip"),
        );
        const hit = local({ x: target.x, y: 224 }),
          foot = local({ x: source.x, y: 319 }),
          ground = local({ x: target.x, y: 319 });
        const phase = ms / 190;
        if (ms < release + 80) {
          for (let i = 0; i < rank + 3; i++) {
            const a = phase + (i * Math.PI * 2) / (rank + 3),
              r = (35 - i * 2) * (1 - charge * 0.6);
            const x = hand.x + Math.cos(a) * r,
              y = hand.y + Math.sin(a) * r * 0.7;
            art
              .fillStyle(i % 2 ? color : 0xf2faff, 0.3 + charge * 0.4)
              .fillCircle(x, y, 1.2 + rank * 0.25);
          }
        }
        const at = mix(hand, hit, smooth(flight));
        switch (spec.motif) {
          case "blade":
            if (ms >= release)
              for (let i = 0; i < 3; i++)
                this.arc(
                  art,
                  at.x - i * 7,
                  at.y + 4,
                  28 + i * 4,
                  -1.45,
                  -1.45 + 2.7 * clamp(flight * 2),
                  i === 2 ? 0xfffae8 : color,
                  i === 2 ? 1.5 : 4,
                  0.8 - i * 0.12,
                );
            break;
          case "shield": {
            const r = 23 + charge * 12;
            const vertices = Array.from({ length: 6 }, (_, i) => ({
              x: hand.x + Math.sin((i * Math.PI) / 3) * r,
              y: hand.y + Math.cos((i * Math.PI) / 3) * r * 1.2,
            }));
            art.lineStyle(2.2, color, 0.25 + charge * 0.5).strokePoints(vertices, true);
            for (let i = 0; i < 3; i++)
              this.arc(
                art,
                hand.x + 8 + i * 11,
                hand.y,
                30 + i * 7,
                -1.2 + flight * 0.2,
                1.2 - flight * 0.2,
                color,
                2,
                flight * (1 - after) * 0.5,
              );
            if (flight > 0) this.curve(art, foot, ground, -8, flight, color, 2);
            break;
          }
          case "spears":
            for (let i = 0; i < 5; i++) {
              const a = phase * 0.35 + (i * Math.PI * 2) / 5;
              const origin = { x: Math.cos(a) * 44, y: -13 + Math.sin(a) * 27 };
              this.diamond(art, origin.x, origin.y, 3, 9, a + Math.PI / 2, color, charge * 0.65);
              if (flight > i * 0.095)
                this.curve(
                  art,
                  origin,
                  hit,
                  (i - 2) * 12,
                  clamp((flight - i * 0.095) * 1.6),
                  color,
                  1.4,
                );
            }
            break;
          case "greatsword": {
            const fall = smooth(clamp((flight - 0.42) / 0.58));
            const y = hit.y - 90 + fall * 70;
            const angle = -0.28 + fall * 0.4;
            this.diamond(art, hit.x, y, 8, 41 * charge, angle, color, 0.65);
            this.arc(
              art,
              hit.x,
              y - 12,
              27,
              -Math.PI + phase * 0.3,
              phase * 0.3,
              0xfff2c7,
              1.5,
              charge * 0.6,
            );
            if (fall > 0)
              this.curve(
                art,
                { x: hit.x, y: y - 40 },
                { x: hit.x, y: hit.y + 36 },
                0,
                fall,
                0xfff3c9,
                4,
              );
            break;
          }
          case "sunrise": {
            const centre = { x: hit.x * 0.45, y: hit.y - 44 };
            this.arc(
              art,
              centre.x,
              centre.y,
              35 + charge * 16,
              phase * 0.3,
              Math.PI * 2 + phase * 0.3,
              color,
              2,
              charge * 0.55,
            );
            for (let i = 0; i < 8; i++) {
              const a = (i * Math.PI) / 4 + phase * 0.2;
              const origin = { x: centre.x + Math.cos(a) * 59, y: centre.y + Math.sin(a) * 44 };
              this.diamond(art, origin.x, origin.y, 2.8, 8, a, color, charge * 0.55);
              if (flight > 0) this.curve(art, origin, hit, Math.sin(a) * 18, flight, color, 1.7);
            }
            if (after > 0)
              this.arc(
                art,
                ground.x,
                ground.y,
                38 + after * 38,
                Math.PI,
                Math.PI * 2,
                0xfff1bf,
                3,
                1 - after,
              );
            break;
          }
          case "arrow":
            for (let i = 0; i < 2; i++)
              this.curve(
                art,
                hand,
                at,
                Math.sin(phase + i * Math.PI) * 8,
                1,
                i ? 0xe8ffff : color,
                1.5,
              );
            this.arc(
              art,
              hand.x,
              hand.y,
              10 + charge * 7,
              phase,
              phase + Math.PI * 1.5,
              color,
              1.5,
              1 - flight,
            );
            break;
          case "arrows":
            for (let i = 0; i < 4; i++) {
              const f = clamp(flight * 1.5 - i * 0.15),
                position = mix(hand, { x: hit.x, y: hit.y + (i - 1.5) * 9 }, smooth(f));
              if (f > 0 && f < 1) {
                this.curve(art, hand, position, (i - 1.5) * 11, 1, color, 1.4);
                this.diamond(art, position.x, position.y, 3, 9, Math.PI / 2, color, 0.65);
              }
            }
            break;
          case "chain":
            for (let i = 0; i < 3; i++)
              if (flight > i * 0.16) {
                const finish = { x: hit.x, y: hit.y + (i - 1) * 20 };
                const points = Array.from({ length: 15 }, (_, j) => {
                  const q = mix(hand, finish, j / 14);
                  return {
                    x: q.x + (j % 2 ? 1 : -1) * Math.sin(j * 1.2 + Math.floor(ms / 38)) * 5,
                    y: q.y + Math.sin(j * 1.7 + Math.floor(ms / 38)) * 7,
                  };
                });
                art
                  .lineStyle(6, color, 0.06)
                  .strokePoints(points, false)
                  .lineStyle(1.3, i % 2 ? 0xe5ffff : color, 0.75)
                  .strokePoints(points, false);
              }
            break;
          case "tornado": {
            const centre = mix({ x: 25, y: hit.y + 10 }, hit, smooth(flight));
            for (let i = 0; i < 5; i++) {
              const radius = 9 + i * 6;
              this.arc(
                art,
                centre.x,
                centre.y + 31 - i * 19,
                radius,
                phase * 3 + i,
                phase * 3 + i + Math.PI * 1.6,
                i % 2 ? 0xe0ffff : color,
                1.8,
                0.55,
              );
            }
            break;
          }
          case "thunderbird": {
            const position = mix(hand, { x: hit.x, y: hit.y - 14 }, smooth(flight));
            const flap = Math.sin(phase * 2.3) * 8;
            for (const side of [-1, 1]) {
              const points = [
                { x: position.x, y: position.y },
                { x: position.x - 10, y: position.y + side * (17 + flap) },
                { x: position.x - 43, y: position.y + side * (30 + flap) },
                { x: position.x - 24, y: position.y + side * 5 },
              ];
              art.lineStyle(1.7, color, 0.7 * charge).strokePoints(points, false);
            }
            this.diamond(
              art,
              position.x + 3,
              position.y,
              3.5,
              10,
              Math.PI / 2,
              0xdbffff,
              charge * 0.8,
            );
            if (flight > 0) this.curve(art, hand, position, Math.sin(phase * 2) * 12, 1, color, 2);
            if (after > 0)
              for (let i = 0; i < 3; i++)
                this.curve(
                  art,
                  { x: hit.x + (i - 1) * 23, y: hit.y - 100 },
                  ground,
                  Math.sin(phase + i) * 13,
                  1,
                  color,
                  2.1,
                );
            break;
          }
          case "prism":
            if (ms < release)
              for (let i = 0; i < 3; i++) {
                const a = phase * 2 + i * 2.1;
                this.diamond(
                  art,
                  hand.x + Math.cos(a) * 17,
                  hand.y + Math.sin(a) * 12,
                  3,
                  7,
                  a,
                  color,
                  charge * 0.7,
                );
              }
            else {
              this.diamond(art, at.x, at.y, 4, 13, phase * 2, color, 0.8);
              for (let i = 0; i < 3; i++)
                this.curve(art, hand, at, (i - 1) * 12, 1, [color, 0xafa5ff, 0x89f7ff][i], 1.3);
            }
            break;
          case "bloom":
            for (let i = 0; i < 7; i++) {
              const f = clamp(flight * 1.5 - i * 0.08),
                point = mix(foot, ground, i / 6);
              point.y -= Math.sin((i / 6) * Math.PI) * 8;
              this.diamond(
                art,
                point.x,
                point.y,
                3 + f * 2,
                (4 + f * 17) * (i === 6 ? 1.3 : 1),
                0,
                color,
                f * 0.6,
              );
              if (i < 6) this.curve(art, point, mix(foot, ground, (i + 1) / 6), -4, f, color, 1.1);
            }
            break;
          case "mirrors": {
            const points = Array.from({ length: 6 }, (_, i) => ({
              x: Math.cos(phase * 0.35 + (i * Math.PI) / 3) * 42,
              y: Math.sin(phase * 0.35 + (i * Math.PI) / 3) * 32 - 12,
            }));
            points.forEach((point, i) => {
              this.diamond(art, point.x, point.y, 5, 11, phase * 0.1 + i, color, charge * 0.35);
              const next = points[(i + 2) % 6];
              if (flight > 0)
                this.curve(art, point, next, 0, clamp(flight * 3 - i * 0.15), color, 1.3);
              if (flight > 0.45)
                this.curve(
                  art,
                  point,
                  hit,
                  (i - 2.5) * 8,
                  clamp((flight - 0.45) * 2.5),
                  i % 2 ? 0xe6caff : color,
                  1.2,
                );
            });
            break;
          }
          case "beam":
            for (let i = 0; i < 4; i++) {
              const t = ((phase * 0.25 + i / 4) % 1) * flight,
                point = mix(hand, hit, t);
              this.arc(
                art,
                point.x,
                point.y,
                8 + Math.sin(phase + i) * 3,
                phase + i,
                phase + i + Math.PI * 1.5,
                [0x8ce8ee, 0xc2b1ff, 0xffc9e5, 0xeaffff][i],
                1.6,
                flight * 0.7,
              );
            }
            this.arc(
              art,
              hand.x,
              hand.y,
              15 + charge * 10,
              -phase * 0.7,
              Math.PI * 2 - phase * 0.7,
              color,
              1.5,
              charge * 0.65,
            );
            break;
          case "sanctuary": {
            const centre = { x: hit.x * 0.54, y: hit.y - 22 },
              r = 48 + charge * 9;
            const points = Array.from({ length: 8 }, (_, i) => ({
              x: centre.x + Math.cos(phase * 0.08 + (i * Math.PI) / 4) * r,
              y: centre.y + Math.sin(phase * 0.08 + (i * Math.PI) / 4) * r * 0.75,
            }));
            for (let i = 0; i < 8; i++) {
              const point = points[i];
              art
                .lineStyle(1, color, charge * 0.3)
                .lineBetween(point.x, point.y, points[(i + 3) % 8].x, points[(i + 3) % 8].y);
              this.diamond(art, point.x, point.y, 3.5, 8, -phase * 0.2, color, charge * 0.65);
              if (flight > 0) this.curve(art, point, hit, (i - 3.5) * 5, flight, color, 1.4);
            }
            this.arc(
              art,
              centre.x,
              ground.y,
              70,
              Math.PI,
              Math.PI + Math.PI * charge,
              color,
              1.3,
              charge * 0.35,
            );
            break;
          }
          case "fist":
            for (let i = 0; i < 3; i++)
              this.arc(
                art,
                hand.x - 8 - i * 5,
                hand.y,
                9 + i * 4,
                phase + i,
                phase + i + Math.PI * 1.15,
                i === 1 ? 0xfff2bd : color,
                1.7,
                0.5 * charge,
              );
            break;
          case "comet":
            for (let i = 0; i < 4; i++)
              this.curve(
                art,
                { x: -65 - i * 9, y: 16 + (i - 1.5) * 7 },
                { x: 25, y: 8 + (i - 1.5) * 6 },
                Math.sin(phase * 3 + i) * 10,
                flight > 0 ? 1 : charge,
                color,
                2,
              );
            if (flight > 0)
              this.curve(art, { x: foot.x - 45, y: foot.y }, foot, -8, 1, 0xffe1a1, 1.5);
            break;
          case "uppercut":
            for (let i = 0; i < 4; i++) {
              const t = clamp(flight * 1.4 - i * 0.07),
                a = phase * 2 + i * 1.3;
              const point = {
                x: hand.x + Math.cos(a) * 21,
                y: hand.y + 32 - t * 60 + Math.sin(a) * 7,
              };
              this.curve(
                art,
                { x: hand.x - 16, y: hand.y + 35 },
                point,
                Math.sin(a) * 22,
                1,
                i % 2 ? 0xfff1bd : color,
                1.7,
              );
            }
            break;
          case "wings":
            for (const side of [-1, 1])
              for (let i = 0; i < 4; i++) {
                const t = clamp(flight * 1.25 - i * 0.08),
                  position = mix({ x: -10 - i * 11, y: side * (15 + i * 8) }, hit, t);
                position.y += side * Math.sin(t * Math.PI) * (22 + i * 8);
                this.diamond(
                  art,
                  position.x,
                  position.y,
                  2.5,
                  9,
                  side * (0.4 - t * 0.7),
                  i % 2 ? 0xffdf8a : color,
                  charge * 0.55,
                );
              }
            break;
          case "phoenix":
            for (let i = 0; i < 7; i++) {
              const a = phase * 0.35 + (i * Math.PI * 2) / 7,
                r = 35 * (1 - flight * 0.7);
              const point = { x: Math.cos(a) * r, y: -12 + Math.sin(a) * r * 0.7 };
              this.diamond(
                art,
                point.x,
                point.y,
                2.8,
                10,
                a + Math.PI / 2,
                i % 2 ? 0xffedb1 : color,
                charge * 0.65,
              );
              if (flight > 0) this.curve(art, point, hit, Math.sin(a) * 27, flight, color, 1.4);
            }
            if (after > 0)
              for (let i = 0; i < 3; i++)
                this.arc(
                  art,
                  ground.x,
                  ground.y,
                  25 + after * 51 + i * 10,
                  Math.PI,
                  Math.PI * 2,
                  color,
                  1.6,
                  (1 - after) * 0.65,
                );
            break;
        }
        const position = fighterSocket(
          source,
          p.fighterId === "ember" ? "lead-hand" : "weapon-tip",
        );
        wake.clear();
        if (ms >= release - 60 && ms <= p.impactMs + 160) {
          history.push(position);
          if (history.length > 8) history.shift();
          for (let i = 1; i < history.length; i++)
            wake
              .lineStyle(1 + i * 0.4, color, i / 28)
              .lineBetween(history[i - 1].x, history[i - 1].y, history[i].x, history[i].y);
        }
      },
      onComplete: () => {
        art.destroy();
        wake.destroy();
      },
    });
    for (let i = 0; i < spec.echoes; i++)
      this.vfx.after(release + 25 + i * Math.min(72, spec.flight / (spec.echoes + 1)), () =>
        this.echo(source, color, 190),
      );
  }

  private arc(
    g: Art,
    x: number,
    y: number,
    r: number,
    start: number,
    end: number,
    color: number,
    width: number,
    alpha: number,
  ) {
    if (alpha <= 0.01 || r <= 0) return;
    g.lineStyle(width, color, alpha).beginPath().arc(x, y, r, start, end).strokePath();
  }
  private curve(g: Art, a: Point, b: Point, bend: number, t: number, color: number, width: number) {
    if (t <= 0) return;
    const points = Array.from({ length: 14 }, (_, i) => {
      const u = (i / 13) * t,
        p = mix(a, b, u);
      return { x: p.x, y: p.y + Math.sin(u * Math.PI) * bend };
    });
    g.lineStyle(width * 4, color, 0.055)
      .strokePoints(points, false)
      .lineStyle(width, color, 0.6)
      .strokePoints(points, false);
  }
  private diamond(
    g: Art,
    x: number,
    y: number,
    w: number,
    h: number,
    angle: number,
    color: number,
    alpha: number,
  ) {
    if (alpha <= 0.01 || h <= 0) return;
    const points = [
      { x: 0, y: -h },
      { x: w, y: 0 },
      { x: 0, y: h },
      { x: -w, y: 0 },
    ].map((p) => ({
      x: x + p.x * Math.cos(angle) - p.y * Math.sin(angle),
      y: y + p.x * Math.sin(angle) + p.y * Math.cos(angle),
    }));
    g.fillStyle(color, alpha * 0.4)
      .fillPoints(points, true)
      .lineStyle(1, color, alpha)
      .strokePoints(points, true);
  }
  private echo(source: Actor, color: number, life: number) {
    const ghost = makePortraitFighter(
      this.scene,
      source.x,
      false,
      source.getData("portraitId") as HeroId,
      true,
      color,
    )
      .setPosition(source.x, source.y)
      .setAngle(source.angle)
      .setScale(source.scaleX, source.scaleY)
      .setAlpha(0.18)
      .setDepth(4)
      .setName("hero-cinematic-echo");
    for (const child of source.list) {
      const original = child as Actor,
        copy = ghost.getByName(child.name) as Actor | null;
      if (copy && child.name !== "hero-shadow")
        copy.setPosition(original.x, original.y).setAngle(original.angle);
    }
    (ghost.getByName("hero-shadow") as Phaser.GameObjects.Graphics).setVisible(false);
    this.vfx.fade(ghost, life);
  }
}
