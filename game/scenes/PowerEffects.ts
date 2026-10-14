import * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { makeFighter } from "@/game/scenes/FighterArt";

type Actor = Phaser.GameObjects.Container;

/** Scene-owned timers, tweens and objects are paused/destroyed with the arena. */
export class PowerEffects {
  constructor(private scene: Phaser.Scene) {}

  play(source: Actor, target: Actor, color: number, plan: AttackPresentation) {
    const direction = source.x < target.x ? 1 : -1;
    const supreme = plan.tier === "finisher";
    this.charge(source.x, color, plan);
    switch (plan.fighterId) {
      case "ninja":
        this.crescents(source, target, color, plan, direction);
        if (supreme) this.tempest(target, color, plan);
        break;
      case "swordsman":
        this.skyBlade(target, color, plan, supreme);
        break;
      case "hunter":
        this.warden(source, target, color, plan, direction, supreme);
        if (supreme) this.eclipse(source, target, color, plan, direction);
        break;
      case "brawler":
        this.tide(source, target, color, plan, direction);
        if (supreme) this.meteorFist(target, color, plan, direction);
        break;
    }
    this.after(plan.impactMs, () => {
      this.ring(target.x, 240, color, supreme ? 5.5 : 2.5, 650);
      if (supreme) {
        this.ring(target.x, 312, color, 8, 850, true);
        this.fracture(target.x, color, plan.intensity);
      }
    });
  }

  private after(delay: number, callback: () => void) {
    this.scene.time.delayedCall(delay, callback);
  }

  private fade(object: Phaser.GameObjects.Graphics | Actor, delay: number, duration = 300) {
    this.scene.tweens.add({
      targets: object,
      alpha: 0,
      delay,
      duration,
      onComplete: () => object.destroy(),
    });
  }

  private ring(x: number, y: number, color: number, scale: number, duration: number, flat = false) {
    const ring = this.scene.add.graphics().setPosition(x, y).setDepth(8);
    ring.lineStyle(3, color, 0.85);
    ring.strokeEllipse(0, 0, 65, flat ? 16 : 65);
    ring.lineStyle(1, 0xeaf3ff, 0.7);
    ring.strokeEllipse(0, 0, 52, flat ? 12 : 52);
    this.scene.tweens.add({
      targets: ring,
      scale,
      alpha: 0,
      duration,
      onComplete: () => ring.destroy(),
    });
  }

  private charge(x: number, color: number, plan: AttackPresentation) {
    const count = Math.min(16, plan.units);
    for (let i = 0; i < count; i++) {
      this.after(i * 55, () => {
        const angle = (i / count) * Math.PI * 2;
        const spark = this.scene.add
          .image(x + Math.cos(angle) * 100, 220 + Math.sin(angle) * 90, "arena-spark")
          .setTint(color)
          .setScale(0.7)
          .setDepth(7);
        this.scene.tweens.add({
          targets: spark,
          x,
          y: 225,
          scale: 0,
          duration: 600,
          onComplete: () => spark.destroy(),
        });
      });
    }
    this.ring(x, 312, color, plan.tier === "finisher" ? 4 : 2, plan.impactMs, true);
  }

  private crescents(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const count = Math.min(plan.units, 9);
    for (let i = 0; i < count; i++) {
      this.after(i * 65, () => {
        const y = 150 + (i % 3) * 38;
        const clone = makeFighter(
          this.scene,
          source.x - direction * (30 + (i % 3) * 25),
          color,
          direction < 0,
          "ninja",
        )
          .setScale(direction * 0.55, 0.55)
          .setAlpha(0.5)
          .setDepth(6);
        this.fade(clone, plan.impactMs - i * 65, 250);
        const arc = this.scene.add.graphics().setPosition(source.x, y).setDepth(8);
        arc.lineStyle(8, color, 0.7);
        arc.beginPath();
        arc.arc(0, 0, 25, -1.5, 1.5);
        arc.strokePath();
        arc.lineStyle(2, 0xf0f5ff);
        arc.beginPath();
        arc.arc(0, 0, 30, -1.5, 1.5);
        arc.strokePath();
        arc.setScale(direction, 1);
        this.scene.tweens.add({
          targets: arc,
          x: target.x,
          y: 225,
          angle: direction * 180,
          delay: Math.max(80, plan.impactMs - i * 65 - 420),
          duration: 400,
          ease: "Cubic.easeIn",
          onComplete: () => arc.destroy(),
        });
      });
    }
  }

  private tempest(target: Actor, color: number, plan: AttackPresentation) {
    const storm = this.scene.add.graphics().setPosition(480, 155).setScale(0.05).setDepth(7);
    for (let i = 0; i < 5; i++) {
      storm.lineStyle(7 - i, color, 0.2 + i * 0.13);
      storm.strokeEllipse(0, 0, 170 - i * 24, 90 - i * 12);
    }
    storm.fillStyle(0xe7f6ff);
    storm.fillCircle(0, 0, 19);
    this.scene.tweens.add({
      targets: storm,
      scale: 1.1 + plan.quality * 0.4,
      angle: 540,
      duration: plan.impactMs - 400,
    });
    this.scene.tweens.add({
      targets: storm,
      x: target.x,
      y: 225,
      delay: plan.impactMs - 380,
      duration: 370,
      ease: "Cubic.easeIn",
    });
    this.fade(storm, plan.impactMs, 450);
    for (let i = 0; i < Math.min(plan.units, 18); i++) {
      this.after(plan.impactMs - 600 + i * 28, () => {
        const bolt = this.scene.add
          .graphics()
          .setPosition(340 + (i % 7) * 45, 115)
          .setDepth(8);
        bolt.lineStyle(4, color, 0.9);
        bolt.lineBetween(0, -26, 0, 6);
        this.scene.tweens.add({
          targets: bolt,
          x: target.x + ((i % 3) - 1) * 20,
          y: 245,
          duration: 350,
          onComplete: () => bolt.destroy(),
        });
      });
    }
  }

  private skyBlade(target: Actor, color: number, plan: AttackPresentation, supreme: boolean) {
    const blade = this.scene.add.graphics().setPosition(target.x, 120).setDepth(8).setScale(0.02);
    if (supreme) {
      blade.fillStyle(color, 0.22);
      blade.fillTriangle(-75, -115, 75, -115, 0, 175);
      blade.fillStyle(color, 0.9);
      blade.fillTriangle(-26, -100, 26, -100, 0, 140);
      blade.fillStyle(0xf1f6ff);
      blade.fillTriangle(-7, -100, 7, -100, 0, 140);
      blade.lineStyle(6, color);
      blade.lineBetween(-60, -65, 60, -65);
    } else {
      blade.lineStyle(16, color, 0.65);
      blade.beginPath();
      blade.arc(0, 0, 88, -1.4, 1.4);
      blade.strokePath();
      blade.lineStyle(3, 0xf0f6ff);
      blade.beginPath();
      blade.arc(0, 0, 98, -1.4, 1.4);
      blade.strokePath();
      blade.setAngle(-45);
    }
    this.scene.tweens.add({
      targets: blade,
      scale: supreme ? 1 + plan.quality * 0.35 : 1,
      duration: plan.impactMs - 300,
    });
    this.scene.tweens.add({
      targets: blade,
      y: 210,
      angle: supreme ? 0 : 30,
      delay: plan.impactMs - 280,
      duration: 270,
      ease: "Cubic.easeIn",
    });
    this.fade(blade, plan.impactMs, 400);
    if (supreme) {
      for (let i = 0; i < 6; i++)
        this.after(plan.impactMs - 300 + i * 70, () => {
          const cut = this.scene.add.graphics().setPosition(target.x, 220).setDepth(9);
          cut.lineStyle(3, color, 0.75);
          cut.lineBetween(-170, (i - 3) * 32, 170, -(i - 3) * 32);
          this.fade(cut, 60, 350);
        });
    }
  }

  private warden(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
    supreme: boolean,
  ) {
    const x = source.x - direction * 30;
    const guardian = makeFighter(this.scene, x, color, direction < 0, "hunter", true)
      .setDepth(6)
      .setY(300)
      .setScale(direction * 0.1, 0.01)
      .setAlpha(0);
    const size = supreme ? 2.2 : 1.6;
    this.scene.tweens.add({
      targets: guardian,
      scaleX: direction * size,
      scaleY: size,
      alpha: 0.9,
      duration: supreme ? 850 : 450,
    });
    const scythe = this.scene.add
      .graphics()
      .setPosition(x + direction * 65, 190)
      .setDepth(7)
      .setAlpha(0);
    scythe.lineStyle(5, color);
    scythe.lineBetween(0, -80, 0, 115);
    scythe.lineStyle(9, color, 0.8);
    scythe.beginPath();
    scythe.arc(0, -35, 55, -1.6, 0.8);
    scythe.strokePath();
    this.scene.tweens.add({ targets: scythe, alpha: 1, duration: 400 });
    this.scene.tweens.add({
      targets: scythe,
      x: target.x,
      angle: direction * 100,
      delay: plan.impactMs - 350,
      duration: 340,
      ease: "Cubic.easeIn",
    });
    this.scene.tweens.add({
      targets: guardian,
      x: target.x - direction * 75,
      delay: plan.impactMs - 350,
      duration: 340,
      ease: "Cubic.easeIn",
    });
    this.fade(guardian, plan.impactMs, 600);
    this.fade(scythe, plan.impactMs, 400);
  }

  private eclipse(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const sun = this.scene.add.graphics().setPosition(480, 175).setScale(0.05).setDepth(2);
    sun.fillStyle(color, 0.16);
    sun.fillCircle(0, 0, 93);
    sun.lineStyle(5, color, 0.8);
    sun.strokeCircle(0, 0, 72);
    sun.fillStyle(0x02030c);
    sun.fillCircle(0, 0, 68);
    this.scene.tweens.add({ targets: sun, scale: 1.3, duration: 1000 });
    this.fade(sun, plan.impactMs, 800);
    for (let i = 0; i < Math.min(plan.units, 20); i++)
      this.after(i * 45, () => {
        const x = source.x - direction * (20 + (i % 5) * 25);
        this.ring(x, 315, color, 1.1, 700, true);
        const shade = makeFighter(this.scene, x, color, direction < 0, "hunter", true)
          .setDepth(4 + (i % 3))
          .setY(295 + (i % 3) * 10)
          .setScale(direction * 0.45, 0.03)
          .setAlpha(0.75);
        this.scene.tweens.add({ targets: shade, scaleY: 0.45, duration: 250 });
        this.scene.tweens.add({
          targets: shade,
          x: target.x + direction * ((i % 5) * 15 - 25),
          delay: plan.impactMs - i * 45 - 450,
          duration: 420,
          ease: "Cubic.easeIn",
        });
        this.fade(shade, plan.impactMs - i * 45, 400);
      });
  }

  private tide(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const count = plan.tier === "finisher" ? 6 : 3;
    for (let i = 0; i < count; i++)
      this.after(i * 100, () => {
        const wave = this.scene.add.graphics().setPosition(source.x, 265).setDepth(7);
        wave.lineStyle(13, color, 0.3);
        wave.beginPath();
        wave.arc(0, 0, 45 + i * 7, -1.5, 1.5);
        wave.strokePath();
        wave.lineStyle(3, color, 0.9);
        wave.beginPath();
        wave.arc(0, 0, 52 + i * 7, -1.5, 1.5);
        wave.strokePath();
        wave.setScale(direction, 1);
        this.scene.tweens.add({
          targets: wave,
          x: target.x,
          scaleY: 1.4,
          delay: plan.impactMs - i * 100 - 500,
          duration: 480,
          ease: "Cubic.easeIn",
          onComplete: () => wave.destroy(),
        });
      });
  }

  private meteorFist(target: Actor, color: number, plan: AttackPresentation, direction: number) {
    const fist = this.scene.add
      .graphics()
      .setPosition(target.x - direction * 120, 125)
      .setScale(0.02)
      .setDepth(8);
    fist.fillStyle(color, 0.15);
    fist.fillEllipse(-direction * 35, -25, 170, 130);
    fist.fillStyle(color, 0.95);
    fist.fillRoundedRect(-50, -35, 100, 70, 16);
    fist.lineStyle(3, 0xffeddf, 0.9);
    fist.strokeRoundedRect(-50, -35, 100, 70, 16);
    for (let i = 0; i < 3; i++) fist.lineBetween(-22 + i * 24, -32, -22 + i * 24, -8);
    fist.fillStyle(color);
    fist.fillRoundedRect(15, 16, 48, 30, 12);
    fist.setAngle(direction * 28);
    this.scene.tweens.add({
      targets: fist,
      scale: 1.2 + plan.quality * 0.5,
      duration: plan.impactMs - 350,
    });
    this.scene.tweens.add({
      targets: fist,
      x: target.x,
      y: 245,
      delay: plan.impactMs - 330,
      duration: 320,
      ease: "Cubic.easeIn",
    });
    this.fade(fist, plan.impactMs, 350);
  }

  private fracture(x: number, color: number, intensity: number) {
    const cracks = this.scene.add.graphics().setPosition(x, 314).setDepth(3);
    cracks.lineStyle(2, color, 0.9);
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const distance = 60 + intensity * 25;
      cracks.beginPath();
      cracks.moveTo(0, 0);
      cracks.lineTo(Math.cos(angle) * distance * 0.5, Math.sin(angle) * 18);
      cracks.lineTo(Math.cos(angle + 0.15) * distance, Math.sin(angle + 0.15) * 40);
      cracks.strokePath();
    }
    this.fade(cracks, 200, 650);
  }
}
