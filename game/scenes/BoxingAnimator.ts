import * as Phaser from "phaser";
import type { CombatEffect } from "@/game/systems/CombatSystem";

type Actor = Phaser.GameObjects.Container;

/** Boxing keeps its own choreography so anime abilities retain their timing. */
export class BoxingAnimator {
  constructor(
    private scene: Phaser.Scene,
    private reducedMotion: boolean,
  ) {}

  play(effect: CombatEffect, source: Actor, target: Actor, color: number) {
    const move = effect.presentation!.abilityId.replace("boxing-", "");
    const recovering = move === "recover";
    const guard = move === "guard";
    const power = move === "uppercut" || move === "counter";
    const direction = source.x < target.x ? 1 : -1;
    const impact = effect.presentation!.impactMs;
    const label = this.scene.add
      .text(480, 105, effect.name.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: power ? "24px" : "17px",
        fontStyle: "bold",
        color: guard ? "#88efce" : recovering ? "#a7bbd8" : "#fce1a7",
        stroke: "#101522",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: label,
      alpha: 0,
      delay: 500,
      duration: 200,
      onComplete: () => label.destroy(),
    });
    if (recovering) return;

    if (!this.reducedMotion) {
      if (guard) {
        for (const name of ["lead-glove", "rear-glove"]) {
          const glove = target.getByName(name) as Actor;
          this.scene.tweens.add({
            targets: glove,
            y: glove.y - 15,
            angle: -20,
            duration: impact,
            yoyo: true,
          });
        }
      }
      this.scene.tweens.add({
        targets: source,
        x: target.x - direction * 105,
        duration: impact,
        ease: "Cubic.easeIn",
        yoyo: true,
      });
      // Gloves pivot independently of the body; an uppercut travels up from below the guard.
      const arm = source.getByName(move === "jab" ? "lead-glove" : "rear-glove") as Actor;
      if (arm) {
        this.scene.tweens.add({
          targets: arm,
          x: arm.x + 42,
          y: arm.y + (move === "uppercut" ? -30 : -4),
          angle: move === "hook" ? -35 : move === "uppercut" ? -65 : 18,
          duration: impact,
          yoyo: true,
          ease: "Back.easeIn",
        });
      }
      if (move === "cross") {
        const lead = source.getByName("lead-glove") as Actor;
        this.scene.tweens.add({
          targets: lead,
          x: lead.x + 25,
          angle: 15,
          duration: 100,
          yoyo: true,
        });
      }
    }

    this.scene.time.delayedCall(impact, () => {
      const x = target.x;
      if (!this.reducedMotion) {
        const burst = this.scene.add.graphics().setPosition(x, 190).setDepth(10);
        if (guard) {
          burst.lineStyle(5, 0x88efce, 0.9).strokeEllipse(0, 25, 95, 125);
          burst.lineStyle(2, 0xe5fff6).strokeEllipse(0, 25, 109, 139);
        } else {
          burst.lineStyle(power ? 5 : 3, color);
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            burst.lineBetween(
              Math.cos(a) * 14,
              Math.sin(a) * 14,
              Math.cos(a) * 52,
              Math.sin(a) * 42,
            );
          }
          burst.lineStyle(3, 0xffe7af).strokeCircle(0, 0, 22);
          this.scene.tweens.add({
            targets: target,
            angle: direction * (power ? 13 : 6),
            duration: 90,
            yoyo: true,
            ease: "Sine.easeOut",
          });
          this.scene.cameras.main.shake(power ? 130 : 65, power ? 0.004 : 0.0015);
          for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.circle(x, 190, 2 + (i % 2), 0xffe6b4).setDepth(11);
            this.scene.tweens.add({
              targets: spark,
              x: x + direction * (30 + i * 9),
              y: 155 + (i % 4) * 23,
              alpha: 0,
              duration: 300,
              onComplete: () => spark.destroy(),
            });
          }
        }
        this.scene.tweens.add({
          targets: burst,
          scale: power ? 2 : 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => burst.destroy(),
        });
      }
      const text = this.scene.add
        .text(x, 143, effect.damage ? `−${effect.damage}` : "BLOCK!", {
          fontFamily: "Arial",
          fontSize: power ? "36px" : "27px",
          fontStyle: "bold",
          color: guard ? "#88efce" : effect.source === "player" ? "#ffe1a3" : "#ff95a9",
          stroke: "#151725",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(15);
      this.scene.tweens.add({
        targets: text,
        y: this.reducedMotion ? 143 : 120,
        alpha: 0,
        duration: 450,
        onComplete: () => text.destroy(),
      });
    });
  }
}
