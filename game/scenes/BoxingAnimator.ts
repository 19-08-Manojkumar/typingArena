import * as Phaser from "phaser";
import type { CombatEffect } from "@/game/systems/CombatSystem";
import { BoxerRig, boxerRest, type BoxerPose } from "@/game/scenes/BoxerRig";

type Actor = Phaser.GameObjects.Container;

/** Scene-clock choreography: connected arms, planted feet, contact, recoil, return to guard. */
export class BoxingAnimator {
  private timers: Phaser.Time.TimerEvent[] = [];
  private tweens: Phaser.Tweens.Tween[] = [];
  private decorations: Phaser.GameObjects.GameObject[] = [];
  private actors: Actor[] = [];
  constructor(
    private scene: Phaser.Scene,
    private reducedMotion: boolean,
  ) {}

  reset() {
    this.timers.forEach((timer) => timer.remove(false));
    this.tweens.forEach((tween) => tween.remove());
    this.decorations.forEach((object) => object.destroy());
    this.actors.forEach((actor) => {
      if (!actor.scene) return;
      actor
        .setPosition(actor.getData("homeX"), actor.getData("homeY"))
        .setAngle(0)
        .setAlpha(1)
        .setDepth(5);
      if (actor instanceof BoxerRig) actor.resetPose();
    });
    this.timers = [];
    this.tweens = [];
    this.decorations = [];
    this.actors = [];
  }

  private after(ms: number, callback: () => void) {
    this.timers.push(this.scene.time.delayedCall(ms, callback));
  }
  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    this.tweens.push(this.scene.tweens.add(config));
  }
  private pose(
    actor: Actor,
    values: Partial<BoxerPose>,
    duration: number,
    ease = "Sine.easeInOut",
  ) {
    if (!(actor instanceof BoxerRig) || this.reducedMotion) return;
    this.tween({
      targets: actor.pose,
      ...values,
      duration,
      ease,
      onUpdate: () => actor.renderPose(),
    });
  }

  play(effect: CombatEffect, source: Actor, target: Actor, color: number) {
    const move = effect.presentation!.abilityId.replace("boxing-", "");
    // A recovery word must not interrupt a punch that's already making contact.
    if (move === "recover") return;
    this.reset();
    this.actors = [source, target];
    for (const actor of this.actors) {
      if (actor.getData("homeX") === undefined)
        actor.setData("homeX", actor.x).setData("homeY", actor.y);
      if (actor instanceof BoxerRig) actor.busy = true;
    }
    const guard = move === "guard";
    source.setDepth(guard ? 5 : 7);
    target.setDepth(guard ? 7 : 5);
    const power = ["uppercut", "counter", "flurry"].includes(move);
    const direction = source.x < target.x ? 1 : -1;
    const plan = effect.presentation!;
    const title = this.scene.add
      .text(480, 115, effect.name.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: power ? "21px" : "16px",
        fontStyle: "bold",
        color: guard ? "#9cedd4" : "#f7dcb0",
        stroke: "#101522",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setName("boxing-move-title");
    this.decorations.push(title);
    this.tween({ targets: title, alpha: 0, delay: plan.durationMs - 180, duration: 160 });

    if (!this.reducedMotion) {
      const firstContact = move === "cross" ? 180 : move === "flurry" ? 220 : plan.impactMs;
      this.pose(
        source,
        move === "counter"
          ? { bodyX: -14, bodyY: 9, headX: -12, headY: 5, twist: -7 }
          : { bodyX: -8, bodyY: move === "uppercut" || move === "hook" ? 9 : 2, twist: -7 },
        105,
      );
      if (move === "uppercut") this.pose(source, { rearX: 24, rearY: -48, rearAngle: 15 }, 105);
      if (move === "hook") this.pose(source, { leadX: 25, leadY: -65, leadAngle: -25 }, 105);
      if (move === "counter") {
        // Slip off the incoming line before turning the rear shoulder through.
        this.pose(target, { leadX: 96, leadY: -102, leadAngle: 70, twist: 7 }, 120);
        this.after(150, () => this.pose(target, { ...boxerRest }, 130));
      }
      this.after(110, () =>
        this.tween({
          targets: source,
          x: target.x - direction * (move === "uppercut" ? 95 : 105),
          duration: Math.max(55, firstContact - 110),
          ease: "Cubic.easeOut",
        }),
      );

      if (guard) {
        this.pose(
          target,
          { leadX: 29, leadY: -116, rearX: 0, rearY: -118, bodyX: -6, bodyY: 4 },
          150,
        );
        this.after(110, () =>
          this.pose(
            source,
            { leadX: 96, leadY: -108, leadAngle: 80, twist: 5 },
            plan.impactMs - 110,
          ),
        );
      } else if (move === "jab") {
        this.after(130, () =>
          this.pose(
            source,
            { bodyX: 4, bodyY: 0, twist: 5, leadX: 98, leadY: -108, leadAngle: 78 },
            130,
            "Cubic.easeOut",
          ),
        );
      } else if (move === "hook") {
        this.after(130, () =>
          this.pose(
            source,
            {
              bodyX: 8,
              bodyY: 6,
              twist: 13,
              leadX: 83,
              leadY: -55,
              leadAngle: -65,
              rearX: 13,
              rearY: -112,
            },
            130,
            "Cubic.easeIn",
          ),
        );
      } else if (move === "uppercut") {
        this.after(140, () =>
          this.pose(
            source,
            {
              bodyX: 7,
              bodyY: -4,
              twist: 10,
              rearX: 69,
              rearY: -110,
              rearAngle: -12,
              leadX: 27,
              leadY: -114,
            },
            210,
            "Cubic.easeIn",
          ),
        );
      } else if (move === "counter") {
        this.after(170, () =>
          this.pose(
            source,
            {
              bodyX: 10,
              bodyY: 0,
              headX: 0,
              headY: 0,
              twist: 12,
              rearX: 94,
              rearY: -110,
              rearAngle: 77,
              leadX: 25,
              leadY: -112,
            },
            180,
            "Cubic.easeOut",
          ),
        );
      } else {
        const flurry = move === "flurry";
        const jabAt = flurry ? 220 : 180;
        this.after(110, () =>
          this.pose(
            source,
            { bodyX: 3, bodyY: 0, leadX: 98, leadY: -108, leadAngle: 78, twist: 4 },
            jabAt - 110,
          ),
        );
        this.after(jabAt + 20, () =>
          this.pose(
            source,
            {
              leadX: 29,
              leadY: -112,
              leadAngle: 0,
              rearX: 94,
              rearY: -109,
              rearAngle: 78,
              bodyX: 9,
              twist: 12,
            },
            flurry ? 220 : 210,
            "Cubic.easeOut",
          ),
        );
        if (flurry) {
          this.after(480, () =>
            this.pose(
              source,
              {
                rearX: 5,
                rearY: -108,
                rearAngle: -12,
                leadX: 20,
                leadY: -70,
                bodyY: 6,
                twist: -10,
              },
              100,
            ),
          );
          this.after(580, () =>
            this.pose(
              source,
              { leadX: 88, leadY: -102, leadAngle: -65, bodyX: 8, bodyY: 0, twist: 14 },
              140,
              "Cubic.easeIn",
            ),
          );
        }
      }
    }

    const contacts =
      move === "flurry" ? [220, 460, 720] : move === "cross" ? [180, 410] : [plan.impactMs];
    contacts.forEach((at, index) =>
      this.after(at, () =>
        this.contact(effect, target, direction, color, move, index === contacts.length - 1),
      ),
    );
    this.after(plan.impactMs + 35, () => {
      if (!this.reducedMotion) {
        this.pose(source, { ...boxerRest }, 200);
        this.tween({
          targets: source,
          x: source.getData("homeX"),
          duration: 210,
          ease: "Sine.easeInOut",
        });
      }
    });
    this.after(plan.durationMs, () => this.reset());
  }

  private contact(
    effect: CombatEffect,
    target: Actor,
    direction: number,
    color: number,
    move: string,
    final: boolean,
  ) {
    const body = move === "hook";
    const guard = move === "guard";
    const power = move === "uppercut" || move === "flurry" || move === "counter";
    const x = target.x - direction * 14;
    const y = target.y + (body ? -54 : -108);
    if (!this.reducedMotion) {
      const burst = this.scene.add
        .graphics()
        .setPosition(x, y)
        .setDepth(10)
        .setName("boxing-contact");
      this.decorations.push(burst);
      burst.lineStyle(guard ? 3 : 2, guard ? 0x9cedd4 : 0xffe1b5, 0.9);
      if (guard) burst.strokeEllipse(0, 5, 48, 68);
      else {
        burst.strokeEllipse(0, 0, body ? 25 : 33, body ? 35 : 26);
        for (let i = 0; i < 7; i++) {
          const a = (i * Math.PI * 2) / 7;
          burst.lineBetween(
            Math.cos(a) * 12,
            Math.sin(a) * 12,
            Math.cos(a) * (power ? 36 : 25),
            Math.sin(a) * (power ? 30 : 21),
          );
        }
        burst.lineStyle(2, color, 0.55).strokeEllipse(0, 0, 44, 37);
      }
      this.tween({ targets: burst, scale: 1.4, alpha: 0, duration: 190 });
      this.pose(
        target,
        guard
          ? { bodyX: -8, bodyY: 3 }
          : body
            ? { bodyX: -7, bodyY: 10, twist: -10, headX: 9, headY: 9 }
            : { bodyX: -6, headX: -11, headY: power ? -7 : -2, twist: -6 },
        65,
      );
      this.after(90, () => this.pose(target, { ...boxerRest }, 110));
      if (power && final) this.scene.cameras.main.shake(75, 0.0015);
    }
    if (!final) return;
    const label = this.scene.add
      .text(x, y - 20, effect.damage ? `−${effect.damage}` : "BLOCK!", {
        fontFamily: "Arial",
        fontSize: power ? "30px" : "24px",
        fontStyle: "bold",
        color: guard ? "#9cedd4" : effect.source === "player" ? "#ffe1b5" : "#ffa8b8",
        stroke: "#101522",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(18)
      .setName("boxing-damage");
    this.decorations.push(label);
    this.tween({
      targets: label,
      y: this.reducedMotion ? y - 20 : y - 36,
      alpha: 0,
      duration: 300,
    });
  }
}
