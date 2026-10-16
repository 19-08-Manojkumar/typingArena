import type * as Phaser from "phaser";

type Art = Phaser.GameObjects.Graphics;
type Actor = Phaser.GameObjects.Container;

/** Short-lived, scene-owned effects. No browser timers or persistent emitters. */
export class AttackVfx {
  constructor(readonly scene: Phaser.Scene) {}

  after(delay: number, action: () => void) {
    return this.scene.time.delayedCall(Math.max(0, delay), action);
  }

  art(x: number, y: number, depth = 8) {
    return this.scene.add.graphics().setPosition(x, y).setDepth(depth);
  }

  fade(object: Art | Actor, duration = 240, delay = 0) {
    this.scene.tweens.add({
      targets: object,
      alpha: 0,
      duration,
      delay,
      onComplete: () => object.destroy(),
    });
  }

  ring(x: number, y: number, color: number, radius = 55, flat = false, delay = 0) {
    this.after(delay, () => {
      const ring = this.art(x, y, flat ? 3 : 8).setScale(0.25);
      ring
        .lineStyle(3, color, 0.8)
        .strokeEllipse(0, 0, radius * 2, flat ? radius * 0.4 : radius * 2);
      ring.lineStyle(1, 0xe5f8ff, 0.7);
      ring.strokeEllipse(0, 0, radius * 1.7, flat ? radius * 0.32 : radius * 1.7);
      this.scene.tweens.add({
        targets: ring,
        scale: 1,
        alpha: 0,
        duration: 450,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    });
  }

  portal(x: number, y: number, color: number, radius: number, life: number) {
    const seal = this.art(x, y, 3).setAlpha(0).setScale(0.6);
    seal.fillStyle(0x050918, 0.9).fillEllipse(0, 0, radius * 2, radius * 0.46);
    seal.lineStyle(2, color, 0.9).strokeEllipse(0, 0, radius * 2, radius * 0.46);
    seal.lineStyle(1, color, 0.45).strokeEllipse(0, 0, radius * 2.3, radius * 0.6);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      seal.lineBetween(
        Math.cos(a) * radius * 0.7,
        Math.sin(a) * radius * 0.16,
        Math.cos(a) * radius,
        Math.sin(a) * radius * 0.23,
      );
    }
    this.scene.tweens.add({ targets: seal, scale: 1, alpha: 1, duration: 180 });
    this.fade(seal, 200, life);
    return seal;
  }

  charge(x: number, y: number, color: number, life: number, count = 8) {
    this.portal(x, 319, color, 48, life);
    for (let i = 0; i < count; i++) {
      this.after((i * Math.max(120, life - 200)) / count, () => {
        const a = (i * Math.PI * 2) / count;
        const mote = this.art(x + Math.cos(a) * 65, y + Math.sin(a) * 44, 7);
        mote.fillStyle(0xe8f7ff).fillCircle(0, 0, 2);
        mote.lineStyle(2, color, 0.6).strokeCircle(0, 0, 5);
        this.scene.tweens.add({
          targets: mote,
          x,
          y,
          alpha: 0,
          duration: 250,
          ease: "Sine.easeIn",
          onComplete: () => mote.destroy(),
        });
      });
    }
  }

  slash(x: number, y: number, color: number, size = 1, angle = -35, life = 220) {
    const cut = this.art(x, y, 9)
      .setAngle(angle)
      .setScale(size * 0.7, size);
    // A filled, tapered crescent reads clearly even at mobile resolution.
    cut.fillStyle(color, 0.16).fillEllipse(0, 0, 108, 43);
    cut.fillStyle(color, 0.85);
    const edge = Array.from({ length: 19 }, (_, i) => {
      const t = i / 18;
      return { x: -53 + 106 * t, y: 13 - 114 * t * (1 - t) };
    });
    const inner = Array.from({ length: 19 }, (_, i) => {
      const t = 1 - i / 18;
      return { x: -53 + 106 * t, y: 13 - 42 * t * (1 - t) };
    });
    cut.fillPoints([...edge, ...inner], true);
    cut.lineStyle(2, 0xeafaff, 0.95);
    cut.strokePoints(edge, false);
    this.scene.tweens.add({
      targets: cut,
      scaleX: size * 1.15,
      alpha: 0,
      duration: life,
      ease: "Quad.easeOut",
      onComplete: () => cut.destroy(),
    });
    return cut;
  }

  projectile(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number,
    duration: number,
    style: "crescent" | "bolt" | "wave",
    size = 1,
  ) {
    const direction = fromX < toX ? 1 : -1;
    const shot = this.art(fromX, fromY).setScale(direction * size, size);
    if (style === "bolt") {
      shot.fillStyle(color, 0.2).fillEllipse(-15, 0, 90, 34);
      shot.fillStyle(0x11162e).fillTriangle(-30, -14, 29, 0, -30, 14);
      shot.lineStyle(3, color).lineBetween(-30, -14, 29, 0);
      shot.lineStyle(1.5, 0xe3f8ff).lineBetween(-18, -4, 24, 0);
    } else {
      const r = style === "wave" ? 46 : 28;
      shot.lineStyle(style === "wave" ? 18 : 10, color, 0.2);
      shot.beginPath().arc(0, 0, r, -1.25, 1.25).strokePath();
      shot.lineStyle(style === "wave" ? 8 : 4, color, 0.95);
      shot.beginPath().arc(0, 0, r, -1.25, 1.25).strokePath();
      shot.lineStyle(2, 0xe4faff);
      shot
        .beginPath()
        .arc(0, 0, r + 5, -1.2, 1.2)
        .strokePath();
    }
    // Three small fading ribbons follow the flight; no unbounded particle stream.
    for (let i = 1; i <= 3; i++) {
      const trail = this.art(fromX - direction * i * 13, fromY, 7);
      trail.lineStyle(4 - i * 0.7, color, 0.5 / i);
      trail.lineBetween(-direction * (22 + i * 8), 0, 0, 0);
      this.scene.tweens.add({
        targets: trail,
        x: toX - direction * i * 13,
        y: toY,
        alpha: 0,
        duration,
        ease: "Cubic.easeIn",
        onComplete: () => trail.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: shot,
      x: toX,
      y: toY,
      duration,
      ease: "Cubic.easeIn",
      onComplete: () => shot.destroy(),
    });
    return shot;
  }

  burst(x: number, y: number, color: number, power = 1) {
    const radius = 28 + Math.min(power, 3) * 18;
    const core = this.art(x, y, 9).setScale(0.2);
    core.fillStyle(color, 0.14).fillCircle(0, 0, radius);
    core.fillStyle(color, 0.45).fillCircle(0, 0, radius * 0.6);
    core.fillStyle(0xeafaff, 0.95).fillCircle(0, 0, radius * 0.25);
    this.scene.tweens.add({
      targets: core,
      scale: 1,
      alpha: 0,
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => core.destroy(),
    });
    this.ring(x, y, color, radius);
    for (let i = 0; i < 8 + Math.round(power * 3); i++) {
      const a = i * 2.39996;
      const spark = this.art(x, y, 10).setRotation(a);
      spark.lineStyle(i % 2 ? 2 : 3, i % 3 ? color : 0xecfaff, 0.9);
      spark.lineBetween(3, 0, 11 + (i % 3) * 4, 0);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * radius * 1.2,
        y: y + Math.sin(a) * radius * 0.8,
        alpha: 0,
        duration: 260 + (i % 3) * 50,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  ground(x: number, color: number, power: number) {
    this.ring(x, 320, color, 60 + power * 18, true);
    const cracks = this.art(x, 320, 3);
    cracks.lineStyle(2, color, 0.65);
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      const dx = Math.cos(a) * (45 + power * 15);
      const dy = Math.sin(a) * 24;
      cracks
        .beginPath()
        .moveTo(0, 0)
        .lineTo(dx * 0.5, dy * 0.35);
      cracks
        .lineTo(dx * 0.7, dy * 0.8)
        .lineTo(dx, dy)
        .strokePath();
      const rock = this.art(x + dx * 0.3, 318, 8);
      rock.fillStyle(color, 0.7).fillTriangle(-3, 3, 0, -4, 5, 2);
      this.scene.tweens.add({
        targets: rock,
        x: x + dx,
        y: 285 - (i % 3) * 13,
        angle: i * 75,
        alpha: 0,
        duration: 400,
        ease: "Quad.easeOut",
        onComplete: () => rock.destroy(),
      });
    }
    this.fade(cracks, 400, 100);
  }
}
