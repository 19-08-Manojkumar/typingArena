import { fighterSocket } from "@/game/scenes/PortraitFighter";
import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { AttackVfx } from "@/game/scenes/AttackVfx";
import { EmberAttacks } from "@/game/scenes/EmberAttacks";
import { heroAttackMotion } from "@/game/scenes/HeroAttackMotion";

type Actor = Phaser.GameObjects.Container;
type Point = { x: number; y: number };

/** Hero-only choreography. Effects share combat's existing impact timestamp and scene clock. */
export class HeroPowerEffects {
  private vfx: AttackVfx;
  constructor(private scene: Phaser.Scene) {
    this.vfx = new AttackVfx(scene);
  }

  play(source: Actor, target: Actor, color: number, p: AttackPresentation) {
    if (p.fighterId === "ember") {
      new EmberAttacks(this.scene).play(source, target, color, p);
      return;
    }
    heroAttackMotion(this.scene, source, target, p);
    const d = source.scaleX < 0 ? -1 : 1;
    const x = source.x;
    const hit = target.x;
    switch (p.abilityId) {
      case "dawn-slash":
        this.sweep(source, color, p.impactMs - 115, -120, 65, 90, 180);
        this.vfx.after(p.impactMs, () => this.vfx.slash(hit, 223, color, 1.15, -45 * d));
        break;
      case "aegis-charge":
        this.attachedGlow(source, "rear-arm", -24, 26, color, p.impactMs, 30);
        this.vfx.after(p.impactMs - 235, () => {
          this.speedLines(x, hit - d * 80, 245, color, d, 235);
          const shield = this.art(x + d * 15, 230, "aegis")
            .setScale(d * 0.7, 0.7)
            .setAlpha(0);
          const points = [
            { x: 0, y: -48 },
            { x: 31, y: -30 },
            { x: 26, y: 20 },
            { x: 0, y: 48 },
            { x: -26, y: 20 },
            { x: -31, y: -30 },
          ];
          shield.fillStyle(color, 0.1).fillPoints(points, true);
          shield.lineStyle(5, color, 0.8).strokePoints(points, true);
          shield.lineStyle(2, 0xfff4d4).lineBetween(0, -29, 0, 26).lineBetween(-19, -2, 19, -2);
          this.scene.tweens.add({
            targets: shield,
            x: hit - d * 42,
            scaleX: d,
            scaleY: 1,
            alpha: 0.9,
            duration: 235,
            ease: "Cubic.easeIn",
          });
          this.vfx.fade(shield, 180, 235);
        });
        this.vfx.ring(hit, 230, color, 68, false, p.impactMs);
        this.vfx.after(p.impactMs, () => this.vfx.ground(hit, color, 0.7));
        break;
      case "sunlance-volley":
        this.seal(x, color, p.impactMs - 140, 46);
        for (let i = 0; i < 5; i++) {
          const y = 160 + i * 24;
          const lance = this.art(x + d * (55 + (2 - Math.abs(i - 2)) * 15), y, "sunlance")
            .setScale(d * 0.05, 0.5)
            .setAlpha(0);
          lance.fillStyle(color, 0.14).fillEllipse(-12, 0, 90, 16);
          lance.fillStyle(0xfff6db).fillTriangle(-33, -3, 35, 0, -33, 3);
          lance.lineStyle(2, color).lineBetween(-48, 0, 25, 0);
          this.scene.tweens.add({
            targets: lance,
            scaleX: d,
            alpha: 1,
            duration: 220,
            delay: i * 70,
            ease: "Sine.easeOut",
          });
          const arrival = p.impactMs - (4 - i) * 45;
          this.vfx.after(arrival - 260, () => {
            this.scene.tweens.add({
              targets: lance,
              x: hit,
              y: 218 + (i - 2) * 7,
              duration: 260,
              ease: "Cubic.easeIn",
              onComplete: () => lance.destroy(),
            });
            this.ribbon({ x: lance.x, y }, { x: hit, y: 218 + (i - 2) * 7 }, color, 260, -15);
          });
          this.vfx.after(arrival, () => this.glint(hit, 218 + (i - 2) * 7, color, 0.7));
        }
        break;
      case "solar-judgement":
        this.sun(x + d * 50, 152, color, p.impactMs - 60, 0.8);
        this.attachedGlow(source, "lead-arm", 66, -84, color, p.impactMs, 28);
        this.sweep(source, color, p.impactMs - 220, -165, 80, 120, 280);
        this.vfx.after(p.impactMs - 250, () => {
          const blade = this.art(hit, 145, "judgement").setScale(0.45, 0.05);
          blade.fillStyle(color, 0.12).fillTriangle(-48, -30, 48, -30, 0, 170);
          blade.fillStyle(color, 0.7).fillTriangle(-17, -30, 17, -30, 0, 162);
          blade.fillStyle(0xfff9e5).fillTriangle(-5, -30, 5, -30, 0, 158);
          blade.lineStyle(4, color).lineBetween(-33, -10, 33, -10);
          this.scene.tweens.add({
            targets: blade,
            scaleX: 1,
            scaleY: 1,
            duration: 250,
            ease: "Cubic.easeIn",
          });
          this.vfx.fade(blade, 280, 250);
        });
        this.vfx.after(p.impactMs, () => {
          this.vfx.ground(hit, color, 1.5);
          this.glint(hit, 228, 0xfff6dc, 2);
        });
        break;
      case "daybreak-ascension": {
        const centre = (x + hit) / 2;
        this.seal(x, color, p.impactMs, 65);
        this.vfx.charge(x, 220, color, 850, 8);
        this.sun(centre, 151, color, p.impactMs, 1.25);
        for (const side of [-1, 1])
          this.vfx.after(420, () => {
            const rays = this.art(x, 223, "dawn-rays").setScale(side * d * 0.1, 0.2);
            rays.fillStyle(color, 0.12).fillTriangle(0, 0, 110, -80, 75, 24);
            rays.lineStyle(2, 0xffefd1, 0.65).lineBetween(0, 0, 98, -50);
            this.scene.tweens.add({
              targets: rays,
              scaleX: side * d,
              scaleY: 1,
              duration: 450,
              ease: "Sine.easeOut",
            });
            this.vfx.fade(rays, 300, p.impactMs - 420);
          });
        this.vfx.after(p.impactMs - 300, () =>
          this.beam(
            { x: centre, y: 151 },
            { x: hit, y: 255 },
            [color, 0xfff1bd, 0xffffff],
            300,
            "daybreak",
            34,
          ),
        );
        this.vfx.ring(hit, 239, color, 82, false, p.impactMs);
        this.vfx.ring(hit, 319, color, 120, true, p.impactMs + 90);
        this.vfx.after(p.impactMs, () => this.particles(hit, 238, color, 12, 90, "light"));
        break;
      }
      case "spark-arrow":
        this.bowstring(source, color, p, 170);
        this.arrow(source, target, color, p.impactMs, 170, 0, 0.8);
        break;
      case "thunder-volley":
        this.bowstring(source, color, p, 425);
        for (let i = 0; i < 4; i++)
          this.arrow(source, target, color, p.impactMs - (3 - i) * 65, 230, (i - 1.5) * 28, 0.85);
        this.vfx.after(p.impactMs, () => this.lightning(hit - d * 45, 185, hit, 237, color));
        break;
      case "chain-lightning":
        this.bowstring(source, color, p, 240);
        this.attachedGlow(source, "lead-arm", 80, -12, color, p.impactMs - 160, 24);
        for (let i = 0; i < 3; i++)
          this.vfx.after(p.impactMs - 180 + i * 90, () => {
            const hand = this.joint(source, "lead-arm", 80, -12);
            const bend = { x: (hand.x + hit) / 2, y: 192 + i * 26 };
            this.lightning(hand.x, hand.y, bend.x, bend.y, color);
            this.lightning(bend.x, bend.y, hit, 213 + i * 13, i % 2 ? 0xc8f8ff : color);
            this.glint(hit, 213 + i * 13, color, 0.7);
          });
        break;
      case "tempest-vortex":
        this.seal(x, color, p.impactMs - 100, 50);
        this.bowstring(source, color, p, 320);
        this.vfx.after(p.impactMs - 650, () => this.vortex(x + d * 80, hit, color, 650));
        this.arrow(source, target, 0xe0fcff, p.impactMs, 290, -35, 1.2);
        this.vfx.ring(hit, 319, color, 95, true, p.impactMs);
        break;
      case "skybreaker":
        this.bowstring(source, color, p, 330);
        this.vfx.charge(x, 214, color, 950, 9);
        this.vfx.after(240, () => {
          const sky = this.art(hit, 150, "storm-cloud").setAlpha(0).setScale(0.3, 1);
          sky.fillStyle(color, 0.08).fillEllipse(0, 0, 210, 48);
          for (let i = 0; i < 3; i++)
            sky.lineStyle(2, color, 0.45).strokeEllipse(0, i * 6, 180 - i * 35, 26);
          this.scene.tweens.add({ targets: sky, alpha: 1, scaleX: 1, duration: 440 });
          this.vfx.fade(sky, 320, p.impactMs - 240);
        });
        this.arrow(source, target, color, p.impactMs, 330, -80, 1.8);
        this.vfx.after(p.impactMs, () => {
          this.lightning(hit, 127, hit, 279, color);
          for (const side of [-1, 1]) this.lightning(hit + side * 55, 152, hit, 240, color);
          this.vfx.ground(hit, color, 1.7);
        });
        break;
      case "prism-bolt":
        this.attachedGlow(source, "lead-arm", 54, -91, color, p.impactMs - 150, 18);
        this.vfx.after(p.impactMs - 160, () => {
          const start = this.joint(source, "lead-arm", 54, -91);
          const gem = this.gem(start.x, start.y, color, 0.65);
          this.fly(gem, start, { x: hit, y: 223 }, color, 160, -8, true);
        });
        break;
      case "crystal-bloom":
        this.seal(hit, color, p.impactMs + 100, 62);
        this.attachedGlow(source, "lead-arm", 54, -91, color, p.impactMs, 24);
        this.spires(hit, color, p.impactMs, 5);
        this.vfx.after(p.impactMs, () => this.particles(hit, 273, color, 9, 60, "crystal"));
        break;
      case "mirror-constellation":
        this.constellation(source, target, color, p);
        break;
      case "aurora-beam":
        this.attachedGlow(source, "lead-arm", 54, -91, color, p.impactMs, 32);
        this.seal(x, color, p.impactMs - 80, 57);
        this.vfx.after(p.impactMs - 300, () => {
          const start = this.joint(source, "lead-arm", 54, -91);
          this.beam(
            start,
            { x: hit, y: 225 },
            [0x8ce8ee, 0xc2b1ff, 0xffc9e5, 0xffffff],
            300,
            "aurora",
            27,
            () => this.joint(source, "lead-arm", 54, -91),
          );
        });
        this.vfx.after(p.impactMs, () => this.particles(hit, 225, color, 8, 70, "crystal"));
        break;
      case "starlight-sanctuary": {
        const centre = (x + hit) / 2;
        this.seal(centre, color, p.impactMs + 180, Math.min(125, Math.abs(hit - x) * 0.32));
        const stars = Array.from({ length: 7 }, (_, i) => ({
          x: centre + Math.cos((i * Math.PI * 2) / 7) * 94,
          y: 201 + Math.sin((i * Math.PI * 2) / 7) * 54,
        }));
        const lines = this.art(centre, 201, "sanctuary").setAlpha(0);
        lines.lineStyle(1, color, 0.65).strokePoints(
          stars.map((star) => ({ x: star.x - centre, y: star.y - 201 })),
          true,
        );
        this.scene.tweens.add({ targets: lines, alpha: 1, duration: 450, delay: 250 });
        this.vfx.fade(lines, 360, p.impactMs);
        stars.forEach((star, i) =>
          this.vfx.after(i * 75, () => {
            const gem = this.gem(star.x, star.y + 10, i % 2 ? 0xd4afff : color, 0.48);
            gem.setAlpha(0);
            this.scene.tweens.add({ targets: gem, y: star.y, alpha: 1, duration: 260 });
            this.vfx.fade(gem, 300, p.impactMs - i * 75);
          }),
        );
        this.spires(hit, color, p.impactMs, 7);
        this.vfx.after(p.impactMs - 310, () =>
          this.beam(
            { x: centre, y: 148 },
            { x: hit, y: 251 },
            [color, 0xe6d5ff, 0xffffff],
            310,
            "starlight",
            31,
          ),
        );
        this.vfx.after(p.impactMs, () => this.particles(hit, 238, color, 12, 90, "crystal"));
        break;
      }
    }
  }

  private art(x: number, y: number, kind: string) {
    return this.vfx.art(x, y).setName(`hero-${kind}`);
  }

  private joint(source: Actor, name: string, x: number, y: number): Point {
    if (source.getData("portraitId"))
      return fighterSocket(source, name === "rear-arm" ? "shield-core" : "weapon-tip");
    return (source.getByName(name) as Actor).getWorldTransformMatrix().transformPoint(x, y);
  }

  private attachedGlow(
    source: Actor,
    joint: string,
    x: number,
    y: number,
    color: number,
    life: number,
    radius: number,
  ) {
    const point = this.joint(source, joint, x, y);
    const glow = this.art(point.x, point.y, "weapon-glow").setScale(0.2);
    glow.fillStyle(color, 0.09).fillCircle(0, 0, radius);
    glow.fillStyle(color, 0.2).fillCircle(0, 0, radius * 0.63);
    glow.fillStyle(0xfff4dc, 0.65).fillCircle(0, 0, 4);
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: life + 130,
      onUpdate: (tween) => {
        const point = this.joint(source, joint, x, y);
        glow
          .setPosition(point.x, point.y)
          .setScale(0.35 + Math.min(1, (Number(tween.getValue()) * (life + 130)) / life) * 0.65);
      },
    });
    this.vfx.fade(glow, 130, life);
  }

  private sweep(
    source: Actor,
    color: number,
    delay: number,
    from: number,
    to: number,
    radius: number,
    duration: number,
  ) {
    this.vfx.after(delay, () => {
      const trail = this.art(0, 0, "weapon-trail").setScale(source.scaleX < 0 ? -1 : 1, 1);
      this.scene.tweens.addCounter({
        from: (from * Math.PI) / 180,
        to: (to * Math.PI) / 180,
        duration,
        ease: "Cubic.easeOut",
        onUpdate: (tween) => {
          const a = Number(tween.getValue());
          const direction = Math.sign(to - from);
          const span = Math.min(1.35, Math.abs(a - (from * Math.PI) / 180));
          const outer = Array.from({ length: 12 }, (_, i) => {
            const b = a - direction * span * (1 - i / 11);
            return { x: Math.cos(b) * radius, y: Math.sin(b) * radius };
          });
          const inner = [...outer].reverse().map((point, i) => ({
            x: point.x * (0.89 + i * 0.009),
            y: point.y * (0.89 + i * 0.009),
          }));
          trail.setPosition(source.x, source.y - 57).clear();
          trail.fillStyle(color, 0.4).fillPoints([...outer, ...inner], true);
          trail.lineStyle(2, 0xfff4d9, 0.8).strokePoints(outer, false);
        },
        onComplete: () => this.vfx.fade(trail, 100),
      });
    });
  }

  private seal(x: number, color: number, life: number, radius: number) {
    const seal = this.art(x, 319, "seal").setDepth(3).setScale(0.1, 0.1).setAlpha(0);
    seal.lineStyle(2, color, 0.55).strokeEllipse(0, 0, radius * 2, radius * 0.45);
    seal.lineStyle(1, color, 0.3).strokeEllipse(0, 0, radius * 1.7, radius * 0.36);
    this.scene.tweens.add({
      targets: seal,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: "Sine.easeOut",
    });
    this.vfx.fade(seal, 260, life);
  }

  private sun(x: number, y: number, color: number, life: number, size: number) {
    const sun = this.art(x, y, "sun").setScale(0.08).setAlpha(0);
    sun.fillStyle(color, 0.07).fillCircle(0, 0, 57);
    sun.lineStyle(2, color, 0.8).strokeCircle(0, 0, 36);
    sun.fillStyle(0xfff1c7, 0.65).fillCircle(0, 0, 23);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      sun.lineBetween(Math.cos(a) * 43, Math.sin(a) * 43, Math.cos(a) * 54, Math.sin(a) * 54);
    }
    this.scene.tweens.add({
      targets: sun,
      scale: size,
      alpha: 1,
      angle: 35,
      duration: 650,
      ease: "Sine.easeOut",
    });
    this.vfx.fade(sun, 320, life);
  }

  private bowstring(source: Actor, color: number, p: AttackPresentation, flight: number) {
    const release = p.impactMs - flight;
    const string = this.art(0, 0, "bowstring");
    this.scene.tweens.addCounter({
      from: 0,
      to: release + 80,
      duration: release + 80,
      onUpdate: (tween) => {
        const ms = Number(tween.getValue());
        const draw =
          ms < release
            ? Math.min(1, ms / Math.min(250, release))
            : Math.max(0, 1 - (ms - release) / 80);
        const top = fighterSocket(source, "bow-top");
        const bottom = fighterSocket(source, "bow-bottom");
        const middle = fighterSocket(source, "bow-draw", -draw * 24.8);
        string.clear().lineStyle(1.5, color, 0.9).strokePoints([top, middle, bottom], false);
        string.fillStyle(0xe8ffff, 0.8).fillCircle(middle.x, middle.y, 2 + draw);
      },
      onComplete: () => string.destroy(),
    });
  }

  private arrow(
    source: Actor,
    target: Actor,
    color: number,
    arrival: number,
    duration: number,
    arc: number,
    size: number,
  ) {
    this.vfx.after(arrival - duration, () => {
      const start = this.joint(source, "lead-arm", 80, -12);
      const arrow = this.art(start.x, start.y, "thunder-arrow").setScale(size);
      arrow.fillStyle(color, 0.13).fillEllipse(-13, 0, 77, 17);
      arrow.lineStyle(3, color).lineBetween(-39, 0, 20, 0);
      arrow.lineStyle(1, 0xeaffff).lineBetween(-30, 0, 22, 0);
      arrow.fillStyle(0xe8ffff).fillTriangle(25, 0, 12, -5, 12, 5);
      arrow.lineStyle(2, color, 0.8).lineBetween(-36, 0, -44, -6).lineBetween(-36, 0, -44, 6);
      this.fly(arrow, start, { x: target.x, y: 224 }, color, duration, arc);
      this.vfx.after(duration, () => this.glint(target.x, 224, color, size));
    });
  }

  /** Six history segments give motion blur without filters, textures, or an emitter per frame. */
  private fly(
    object: Phaser.GameObjects.Graphics,
    start: Point,
    end: Point,
    color: number,
    duration: number,
    arc: number,
    spin = false,
  ) {
    const trail = this.art(start.x, start.y, "flight-trail").setDepth(7);
    const history: Point[] = [];
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: "Quad.easeIn",
      onUpdate: (tween) => {
        const t = Number(tween.getValue());
        const point = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t + Math.sin(t * Math.PI) * arc,
        };
        object.setPosition(point.x, point.y);
        object.rotation = spin
          ? t * Math.PI * 3
          : Math.atan2(end.y - start.y + Math.cos(t * Math.PI) * arc * Math.PI, end.x - start.x);
        history.push(point);
        if (history.length > 7) history.shift();
        trail.clear();
        for (let i = 1; i < history.length; i++)
          trail
            .lineStyle(1 + i * 0.55, color, i / 18)
            .lineBetween(
              history[i - 1].x - start.x,
              history[i - 1].y - start.y,
              history[i].x - start.x,
              history[i].y - start.y,
            );
      },
      onComplete: () => {
        object.destroy();
        this.vfx.fade(trail, 100);
      },
    });
  }

  private ribbon(start: Point, end: Point, color: number, duration: number, arc: number) {
    const point = this.art(start.x, start.y, "lance-tip");
    point.fillStyle(0xfff6d4).fillCircle(0, 0, 2);
    this.fly(point, start, end, color, duration, arc);
  }

  private lightning(x: number, y: number, toX: number, toY: number, color: number) {
    const bolt = this.art(x, y, "lightning");
    const points = Array.from({ length: 11 }, (_, i) => ({
      x: ((toX - x) * i) / 10 + (i && i < 10 ? (i % 2 ? 8 : -8) : 0),
      y: ((toY - y) * i) / 10 + (i && i < 10 ? (i % 2 ? 11 : -11) : 0),
    }));
    bolt.lineStyle(9, color, 0.12).strokePoints(points, false);
    bolt.lineStyle(3, color, 0.9).strokePoints(points, false);
    bolt.lineStyle(1, 0xeaffff).strokePoints(points, false);
    this.vfx.fade(bolt, 170);
  }

  private vortex(from: number, to: number, color: number, duration: number) {
    const wind = this.art(from, 238, "vortex").setScale(0.2);
    const leaves = this.art(from, 238, "wind-debris");
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: (tween) => {
        const t = Number(tween.getValue());
        wind
          .setPosition(from + (to - from) * t * t, 238)
          .setScale(0.35 + t * 0.65)
          .clear();
        leaves.setPosition(wind.x, wind.y).clear();
        for (let i = 0; i < 5; i++) {
          const a = t * Math.PI * 5 + i;
          const width = 75 - i * 9;
          const curve = Array.from({ length: 16 }, (_, j) => ({
            x: Math.cos(a + (j * Math.PI) / 10) * width * 0.5,
            y: 45 - i * 23 + Math.sin(a + (j * Math.PI) / 10) * 9.5,
          }));
          wind.lineStyle(2 + (i % 2), i % 2 ? color : 0xe0fbff, 0.6).strokePoints(curve, false);
          leaves
            .fillStyle(color, 0.8)
            .fillCircle(Math.cos(a) * width * 0.5, 45 - i * 23 + Math.sin(a) * 9, 2);
        }
      },
      onComplete: () => {
        this.vfx.fade(wind, 230);
        this.vfx.fade(leaves, 180);
      },
    });
  }

  private gem(x: number, y: number, color: number, size = 1) {
    const gem = this.art(x, y, "crystal").setScale(size);
    const points = [
      { x: 0, y: -23 },
      { x: 13, y: 0 },
      { x: 0, y: 22 },
      { x: -13, y: 0 },
    ];
    gem.fillStyle(color, 0.8).fillPoints(points, true);
    gem.fillStyle(0xf5f6ff, 0.35).fillTriangle(0, -23, -13, 0, -2, 4);
    gem.lineStyle(1.5, 0xe9f5ff, 0.9).strokePoints(points, true);
    gem
      .lineStyle(1, 0xffffff, 0.6)
      .lineBetween(0, -23, -2, 4)
      .lineBetween(-2, 4, 0, 22)
      .lineBetween(-13, 0, 13, 0);
    return gem;
  }

  private spires(x: number, color: number, impact: number, count: number) {
    // The centre spire peaks at the damage cue; outer spires are decorative precursors.
    for (let i = 0; i < count; i++) {
      const distance = Math.abs(i - (count - 1) / 2);
      const arrival = impact - distance * 55;
      this.vfx.after(arrival - 230, () => {
        const spire = this.gem(x + (i - (count - 1) / 2) * 24, 318, color);
        const height = 2.25 - distance * 0.25;
        spire.setDepth(6).setScale(0.72, 0.02);
        this.scene.tweens.add({
          targets: spire,
          y: 318 - height * 22,
          scaleY: height,
          duration: 230,
          ease: "Cubic.easeOut",
        });
        this.vfx.fade(spire, 280, 390);
      });
    }
    this.vfx.ring(x, 317, color, 65, true, impact);
  }

  private constellation(source: Actor, target: Actor, color: number, p: AttackPresentation) {
    const centre = { x: source.x, y: 203 };
    const count = 6;
    const lines = this.art(centre.x, centre.y, "constellation");
    const gems = Array.from({ length: count }, () =>
      this.gem(centre.x, centre.y, color, 0.52).setAlpha(0),
    );
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: p.impactMs - 280,
      onUpdate: (tween) => {
        const t = Number(tween.getValue());
        const radius = 20 + Math.min(1, t * 3) * 48;
        const points = gems.map((gem, i) => {
          const a = t * Math.PI * 1.4 + (i * Math.PI) / 3;
          const point = { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.65 };
          gem
            .setPosition(centre.x + point.x, centre.y + point.y)
            .setAlpha(Math.min(1, t * 4))
            .setRotation(-a * 0.35);
          return point;
        });
        lines.clear().lineStyle(1, color, 0.35).strokePoints(points, true);
      },
      onComplete: () => {
        this.vfx.fade(lines, 120);
        gems.forEach((gem, i) => {
          const start = { x: gem.x, y: gem.y };
          this.fly(
            gem,
            start,
            { x: target.x, y: 215 + (i % 3) * 9 },
            color,
            160 + i * 24,
            (i % 2 ? 1 : -1) * 32,
            true,
          );
        });
      },
    });
  }

  private beam(
    start: Point,
    end: Point,
    colors: number[],
    grow: number,
    kind: string,
    width: number,
    origin?: () => Point,
  ) {
    const beam = this.art(start.x, start.y, kind).setScale(0);
    colors.forEach((color, i) =>
      beam
        .lineStyle(width * (1 - i / colors.length), color, i === colors.length - 1 ? 0.95 : 0.28)
        .lineBetween(0, 0, 100, 0),
    );
    this.scene.tweens.addCounter({
      from: 0,
      to: grow + 340,
      duration: grow + 340,
      onUpdate: (tween) => {
        const ms = Number(tween.getValue());
        const point = origin?.() ?? start;
        const dx = end.x - point.x,
          dy = end.y - point.y;
        const progress = Math.min(1, ms / grow) ** 3;
        const fade = Math.max(0, Math.min(1, (ms - grow - 60) / 280));
        beam.setPosition(point.x, point.y).setRotation(Math.atan2(dy, dx));
        beam
          .setScale(
            (Math.hypot(dx, dy) / 100) * progress,
            (0.15 + progress * 0.85) * (1 - fade * 0.95),
          )
          .setAlpha(1 - fade);
      },
      onComplete: () => beam.destroy(),
    });
  }

  private speedLines(
    from: number,
    to: number,
    y: number,
    color: number,
    d: number,
    duration: number,
  ) {
    const lines = this.art(from, y, "speed-lines").setDepth(4);
    for (let i = 0; i < 5; i++)
      lines
        .lineStyle(i % 2 ? 2 : 1, color, 0.16 + i * 0.03)
        .lineBetween(-d * (30 + i * 10), (i - 2) * 19, d * 22, (i - 2) * 19);
    this.scene.tweens.add({
      targets: lines,
      x: to,
      alpha: 0,
      duration,
      ease: "Cubic.easeIn",
      onComplete: () => lines.destroy(),
    });
  }

  private glint(x: number, y: number, color: number, size: number) {
    const light = this.art(x, y, "hit-flash").setScale(0.15);
    light.fillStyle(0xfff9e6, 0.9).fillPoints(
      [
        { x: -22, y: 0 },
        { x: -4, y: -4 },
        { x: 0, y: -24 },
        { x: 4, y: -4 },
        { x: 22, y: 0 },
        { x: 4, y: 4 },
        { x: 0, y: 24 },
        { x: -4, y: 4 },
      ],
      true,
    );
    light.lineStyle(1, color, 0.8).strokeCircle(0, 0, 17);
    this.scene.tweens.add({
      targets: light,
      scale: size,
      alpha: 0,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => light.destroy(),
    });
  }

  private particles(
    x: number,
    y: number,
    color: number,
    count: number,
    radius: number,
    style: "light" | "crystal" | "ember",
  ) {
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996;
      const spark = this.art(x, y, `${style}-particle`).setRotation(a);
      if (style === "crystal")
        spark.fillStyle(i % 2 ? color : 0xeee6ff, 0.8).fillTriangle(-3, 3, 0, -6, 3, 2);
      else
        spark
          .lineStyle(style === "ember" ? 3 : 2, i % 3 ? color : 0xfff4db, 0.8)
          .lineBetween(0, 0, style === "ember" ? 7 : 4, 0);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * radius,
        y: y + Math.sin(a) * radius * 0.65 - (style === "ember" ? 20 : 0),
        angle: i * 55,
        alpha: 0,
        duration: 240 + (i % 3) * 30,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }
}
