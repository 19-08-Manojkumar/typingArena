import * as Phaser from "phaser";
import type { CombatEffect } from "@/game/systems/CombatSystem";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { makeFighter } from "@/game/scenes/FighterArt";
import { PowerEffects } from "@/game/scenes/PowerEffects";
import { BoxingAnimator } from "@/game/scenes/BoxingAnimator";

type Actor = Phaser.GameObjects.Container;
export class AttackAnimator {
  constructor(
    private scene: Phaser.Scene,
    private reducedMotion: boolean,
  ) {}
  play(effect: CombatEffect, source: Actor, target: Actor, color: number) {
    if (effect.presentation?.abilityId.startsWith("boxing-")) {
      new BoxingAnimator(this.scene, this.reducedMotion).play(effect, source, target, color);
      return;
    }
    const plan: AttackPresentation = effect.presentation ?? {
      abilityId: "punch",
      fighterId: "boxer",
      tier: "basic",
      quality: 0.8,
      intensity: 0.7,
      units: 1,
      impactMs: 240,
      durationMs: 650,
      rating: "POWERFUL",
    };
    const direction = source.x < target.x ? 1 : -1;
    const at = (delay: number, fn: () => void) => this.scene.time.delayedCall(delay, fn);
    const ultimate = plan.tier === "ultimate" || plan.tier === "finisher";
    const special = plan.tier !== "basic";
    if (special) {
      const title = this.scene.add
        .text(480, 108, `${plan.rating} · ${effect.name.toUpperCase()}`, {
          fontFamily: "Arial",
          fontSize: ultimate ? "21px" : "16px",
          fontStyle: "bold",
          color: `#${color.toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0.5)
        .setDepth(20);
      this.scene.tweens.add({
        targets: title,
        alpha: 0,
        delay: plan.durationMs - 350,
        duration: 300,
        onComplete: () => title.destroy(),
      });
    }
    if (this.reducedMotion) {
      at(plan.impactMs, () => this.impact(target, effect, color, plan));
      return;
    }
    if (ultimate) {
      const shade = this.scene.add.rectangle(480, 220, 960, 440, 0x030511, 0.55).setDepth(1);
      this.scene.tweens.add({
        targets: shade,
        alpha: 0,
        delay: plan.impactMs,
        duration: 500,
        onComplete: () => shade.destroy(),
      });
    }
    source.setDepth(5);
    target.setDepth(5);
    switch (plan.abilityId) {
      case "crescent-barrage":
      case "moonfall-cleave":
      case "night-warden":
      case "tidal-breaker":
      case "celestial-tempest":
      case "heaven-splitter":
      case "eclipse-dominion":
      case "worldbreaker":
        new PowerEffects(this.scene).play(source, target, color, plan);
        break;
      case "shadow-summon":
      case "shadow-army":
      case "shadow-clone":
        this.summon(source, target, color, plan, direction);
        break;
      case "energy-sphere":
        this.orb(source, target, color, plan, direction);
        break;
      case "rapid-blade":
      case "phantom-strike":
        this.blades(source, target, color, plan, direction);
        break;
      case "power-smash":
      case "finisher":
        this.smash(source, target, color, plan, direction);
        break;
      case "shadow-strike":
        this.shadowBolt(source, target, color, plan, direction);
        break;
      default:
        this.lunge(source, target, plan.impactMs, direction);
        if (plan.fighterId === "swordsman" || plan.fighterId === "ninja")
          at(plan.impactMs - 60, () => this.slash(target.x, 226, color, 1));
    }
    at(plan.impactMs, () => this.impact(target, effect, color, plan));
  }
  private lunge(source: Actor, target: Actor, impact: number, direction: number) {
    const origin = source.x;
    this.scene.tweens.add({
      targets: source,
      x: target.x - direction * 85,
      duration: impact,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.tweens.add({ targets: source, x: origin, duration: 230, ease: "Power2" });
      },
    });
  }
  private portal(x: number, color: number, scale: number, life: number) {
    const portal = this.scene.add.graphics().setPosition(x, 314).setDepth(3);
    portal.fillStyle(0x080714, 0.95);
    portal.fillEllipse(0, 0, 100 * scale, 24 * scale);
    portal.lineStyle(3, color, 0.85);
    portal.strokeEllipse(0, 0, 100 * scale, 24 * scale);
    portal.lineStyle(1, color, 0.4);
    portal.strokeEllipse(0, 0, 125 * scale, 34 * scale);
    portal.setScale(0.05, 1);
    this.scene.tweens.add({ targets: portal, scaleX: 1, duration: 220 });
    this.scene.tweens.add({
      targets: portal,
      alpha: 0,
      delay: life,
      duration: 250,
      onComplete: () => portal.destroy(),
    });
  }
  private summon(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const clones = plan.abilityId === "shadow-clone";
    const army = plan.abilityId === "shadow-army";
    const count = army ? plan.units : clones ? plan.units : 1;
    this.portal(source.x, color, army ? 2.4 : 1.2, plan.impactMs);
    for (let i = 0; i < count; i++) {
      const delay = i * (army ? 55 : 85);
      this.scene.time.delayedCall(delay, () => {
        const x = source.x - direction * (45 + (i % 4) * 34);
        const minion = makeFighter(
          this.scene,
          x,
          color,
          direction < 0,
          clones ? "ninja" : "hunter",
          !clones,
        ).setDepth(6);
        const scale = army ? 0.48 + (i % 3) * 0.08 : clones ? 0.72 : 1.35 + plan.quality * 0.2;
        minion
          .setAlpha(0)
          .setScale(direction * scale, 0.04)
          .setY(295 + (i % 3) * 10);
        this.scene.tweens.add({
          targets: minion,
          alpha: clones ? 0.6 : 0.9,
          scaleY: scale,
          duration: 220,
        });
        this.scene.tweens.add({
          targets: minion,
          x: target.x - direction * (15 + (i % 3) * 13),
          delay: Math.max(220, plan.impactMs - delay - 380),
          duration: 340,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.slash(target.x, 210 + (i % 3) * 15, color, army ? 0.7 : 1.3);
            this.scene.tweens.add({
              targets: minion,
              alpha: 0,
              x: target.x + direction * 35,
              duration: 220,
              onComplete: () => minion.destroy(),
            });
          },
        });
      });
    }
  }
  private orb(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const orb = this.scene.add.container(source.x + direction * 70, 180).setDepth(8);
    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.16);
    glow.fillCircle(0, 0, 58);
    glow.fillStyle(color, 0.8);
    glow.fillCircle(0, 0, 32);
    glow.fillStyle(0xeef9ff);
    glow.fillCircle(0, 0, 16);
    glow.lineStyle(2, 0xe0edff, 0.9);
    glow.strokeEllipse(0, 0, 86, 27);
    orb.add(glow);
    orb.setScale(0.05);
    this.scene.tweens.add({
      targets: orb,
      scale: 0.75 + plan.intensity * 0.3,
      angle: 540,
      duration: plan.impactMs - 390,
    });
    this.scene.tweens.add({
      targets: orb,
      x: target.x,
      y: 215,
      delay: plan.impactMs - 360,
      duration: 350,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.tweens.add({
          targets: orb,
          scale: 2.5,
          alpha: 0,
          duration: 350,
          onComplete: () => orb.destroy(),
        });
      },
    });
  }
  private blades(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    if (plan.tier === "ultimate") {
      this.scene.tweens.add({
        targets: source,
        alpha: 0.15,
        duration: 180,
        yoyo: true,
        hold: plan.impactMs - 350,
      });
      for (let i = 0; i < 4; i++) {
        const ghost = makeFighter(
          this.scene,
          source.x + direction * i * 70,
          color,
          direction < 0,
          "swordsman",
        )
          .setAlpha(0.2)
          .setDepth(4);
        this.scene.tweens.add({
          targets: ghost,
          x: target.x - direction * 50,
          alpha: 0,
          delay: i * 100,
          duration: 650,
          onComplete: () => ghost.destroy(),
        });
      }
    } else this.lunge(source, target, plan.impactMs - 250, direction);
    for (let i = 0; i < plan.units; i++)
      this.scene.time.delayedCall(plan.impactMs - 200 + i * 45, () =>
        this.slash(target.x + ((i % 3) - 1) * 22, 225, color, plan.intensity),
      );
  }
  private smash(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const origin = source.x;
    this.scene.tweens.add({
      targets: source,
      x: origin - direction * 35,
      y: plan.tier === "ultimate" ? 195 : 254,
      duration: 300,
    });
    this.scene.tweens.add({
      targets: source,
      x: target.x - direction * 65,
      y: 278,
      delay: plan.impactMs - 260,
      duration: 250,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.tweens.add({ targets: source, x: origin, duration: 350 });
      },
    });
    this.scene.time.delayedCall(plan.impactMs, () => {
      const wave = this.scene.add.graphics().setPosition(target.x, 298).setDepth(7);
      wave.lineStyle(5, color);
      wave.strokeEllipse(0, 0, 70, 20);
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        wave.lineBetween(0, 0, Math.cos(angle) * 50, Math.sin(angle) * 18);
      }
      this.scene.tweens.add({
        targets: wave,
        scaleX: plan.tier === "ultimate" ? 7 : 4,
        scaleY: 3,
        alpha: 0,
        duration: 500,
        onComplete: () => wave.destroy(),
      });
    });
  }
  private shadowBolt(
    source: Actor,
    target: Actor,
    color: number,
    plan: AttackPresentation,
    direction: number,
  ) {
    const bolt = this.scene.add
      .graphics()
      .setPosition(source.x + direction * 50, 215)
      .setDepth(7);
    bolt.fillStyle(0x111126);
    bolt.fillTriangle(-direction * 32, -13, direction * 30, 0, -direction * 32, 13);
    bolt.lineStyle(2, color);
    bolt.lineBetween(-direction * 32, -13, direction * 30, 0);
    this.scene.tweens.add({
      targets: bolt,
      x: target.x,
      duration: plan.impactMs,
      ease: "Power2",
      onComplete: () => bolt.destroy(),
    });
  }
  private slash(x: number, y: number, color: number, scale: number) {
    const slash = this.scene.add.graphics().setPosition(x, y).setScale(scale).setDepth(9);
    slash.lineStyle(7, color, 0.75);
    slash.lineBetween(-35, 42, 35, -42);
    slash.lineStyle(2, 0xf0f2ff);
    slash.lineBetween(-37, 42, 35, -45);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: scale * 1.3,
      duration: 250,
      onComplete: () => slash.destroy(),
    });
  }
  private impact(target: Actor, effect: CombatEffect, color: number, plan: AttackPresentation) {
    if (!this.reducedMotion) {
      const count = Math.min(48, Math.round(8 + plan.intensity * 12));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const spark = this.scene.add
          .image(target.x, 220, "arena-spark")
          .setTint(color)
          .setScale(0.4 + plan.intensity * 0.15)
          .setDepth(10);
        this.scene.tweens.add({
          targets: spark,
          x: target.x + Math.cos(angle) * (40 + plan.intensity * 45),
          y: 220 + Math.sin(angle) * (30 + plan.intensity * 35),
          alpha: 0,
          duration: 350,
          onComplete: () => spark.destroy(),
        });
      }
      this.scene.tweens.add({
        targets: target,
        alpha: 0.3,
        duration: 70,
        yoyo: true,
        repeat: plan.tier === "finisher" ? 3 : plan.tier === "ultimate" ? 2 : 1,
      });
      if (plan.tier !== "basic")
        this.scene.cameras.main.shake(
          plan.tier === "finisher" ? 250 : 100,
          Math.min(0.007, plan.intensity * 0.0025),
        );
    }
    const text = this.scene.add
      .text(target.x, 150, effect.damage ? `−${effect.damage}` : "BLOCK", {
        fontFamily: "Arial",
        fontSize: `${Math.round(24 + plan.intensity * 6)}px`,
        fontStyle: "bold",
        color: effect.source === "player" ? "#e0d5ff" : "#ffb3c1",
      })
      .setOrigin(0.5)
      .setDepth(15);
    this.scene.tweens.add({
      targets: text,
      y: this.reducedMotion ? 150 : 120,
      alpha: 0,
      duration: 650,
      onComplete: () => text.destroy(),
    });
  }
}
