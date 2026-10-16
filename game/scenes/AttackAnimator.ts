import type * as Phaser from "phaser";
import type { CombatEffect } from "@/game/systems/CombatSystem";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { AttackVfx } from "@/game/scenes/AttackVfx";
import { PowerEffects } from "@/game/scenes/PowerEffects";
import { BoxingAnimator } from "@/game/scenes/BoxingAnimator";

type Actor = Phaser.GameObjects.Container;

export class AttackAnimator {
  private boxingAnimator?: BoxingAnimator;
  constructor(
    private scene: Phaser.Scene,
    private reducedMotion: boolean,
  ) {}

  resetBoxing() {
    this.boxingAnimator?.reset();
  }

  play(effect: CombatEffect, source: Actor, target: Actor, color: number) {
    if (effect.presentation?.abilityId.startsWith("boxing-")) {
      this.boxingAnimator ??= new BoxingAnimator(this.scene, this.reducedMotion);
      this.boxingAnimator.play(effect, source, target, color);
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
    const vfx = new AttackVfx(this.scene);
    const ultimate = plan.tier === "ultimate" || plan.tier === "finisher";
    if (plan.tier !== "basic") {
      const title = this.scene.add
        .text(480, 108, `${plan.rating} · ${effect.name.toUpperCase()}`, {
          fontFamily: "Arial",
          fontSize: ultimate ? "21px" : "16px",
          fontStyle: "bold",
          color: `#${color.toString(16).padStart(6, "0")}`,
          stroke: "#080e21",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(20)
        .setAlpha(0);
      this.scene.tweens.add({ targets: title, alpha: 1, duration: this.reducedMotion ? 0 : 160 });
      this.scene.tweens.add({
        targets: title,
        alpha: 0,
        delay: plan.durationMs - 300,
        duration: 200,
        onComplete: () => title.destroy(),
      });
    }
    if (!this.reducedMotion) {
      if (ultimate) {
        const shade = this.scene.add
          .rectangle(480, 220, 960, 440, 0x030511, 0.5)
          .setDepth(1)
          .setAlpha(0);
        this.scene.tweens.add({ targets: shade, alpha: 1, duration: 220 });
        this.scene.tweens.add({
          targets: shade,
          alpha: 0,
          delay: plan.impactMs,
          duration: 400,
          onComplete: () => shade.destroy(),
        });
      }
      source.setDepth(5);
      target.setDepth(5);
      new PowerEffects(this.scene).play(source, target, color, plan);
    }
    // Decorative multi-hits never apply damage. The main cue shares combat's impact timestamp.
    vfx.after(plan.impactMs, () => this.impact(source, target, effect, color, plan, vfx));
  }

  private impact(
    source: Actor,
    target: Actor,
    effect: CombatEffect,
    color: number,
    plan: AttackPresentation,
    vfx: AttackVfx,
  ) {
    if (!this.reducedMotion) {
      vfx.burst(target.x, 226, color, Math.min(2.8, plan.intensity));
      const rest = { angle: target.angle, y: target.y };
      const direction = source.x < target.x ? 1 : -1;
      this.scene.tweens.add({
        targets: target,
        angle: rest.angle + direction * Math.min(13, 4 + plan.intensity * 3),
        y: rest.y - Math.min(7, plan.intensity * 2),
        duration: 85,
        ease: "Sine.easeOut",
        yoyo: true,
      });
      this.scene.tweens.add({ targets: target, alpha: 0.5, duration: 65, yoyo: true });
      this.scene.cameras.main.shake(
        plan.tier === "finisher" ? 180 : 75,
        Math.min(0.0045, plan.intensity * 0.0015),
      );
    } else {
      const cue = vfx.art(target.x, 226, 9);
      cue.lineStyle(2, color, 0.8).strokeCircle(0, 0, 30);
      vfx.fade(cue, 220);
    }
    const text = this.scene.add
      .text(target.x, 150, effect.damage ? `−${effect.damage}` : "BLOCK", {
        fontFamily: "Arial",
        fontSize: `${Math.round(24 + plan.intensity * 5)}px`,
        fontStyle: "bold",
        color: effect.source === "player" ? "#e0d5ff" : "#ffb3c1",
        stroke: "#0c1024",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(15);
    this.scene.tweens.add({
      targets: text,
      y: this.reducedMotion ? 150 : 131,
      alpha: 0,
      duration: 520,
      onComplete: () => text.destroy(),
    });
  }
}
