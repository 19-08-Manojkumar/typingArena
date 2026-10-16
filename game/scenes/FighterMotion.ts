import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";

type Actor = Phaser.GameObjects.Container;
export type StrikeStyle = "dash" | "blade" | "cast" | "punch" | "slam";

/** Animate the rig, then restore every changed property before the next cast. */
export function fighterMotion(
  scene: Phaser.Scene,
  source: Actor,
  target: Actor,
  plan: AttackPresentation,
  style: StrikeStyle,
) {
  const direction = source.x < target.x ? 1 : -1;
  const origin = { x: source.x, y: source.y, angle: source.angle };
  const cast = style === "cast";
  const comboHold = plan.abilityId === "rapid-blade" ? 220 : 0;
  const windup = Math.min(220, plan.impactMs * 0.3);
  const travel = Math.min(240, plan.impactMs * 0.5);
  const release = plan.impactMs - comboHold - travel;
  scene.tweens.add({
    targets: source,
    x: origin.x - direction * (cast ? 7 : 17),
    y: origin.y + (style === "slam" ? 7 : 2),
    angle: origin.angle - direction * (cast ? 3 : 7),
    duration: windup,
    ease: "Sine.easeOut",
  });
  const arm = source.getByName("lead-arm") as Actor | null;
  const rear = source.getByName("rear-arm") as Actor | null;
  const rest = arm ? { x: arm.x, y: arm.y, angle: arm.angle } : null;
  if (arm) {
    scene.tweens.add({
      targets: arm,
      angle: style === "blade" ? -65 : style === "slam" ? -100 : cast ? -35 : 38,
      duration: windup,
    });
  }
  if (rear) scene.tweens.add({ targets: rear, angle: -15, duration: windup });
  scene.time.delayedCall(release, () => {
    if (arm)
      scene.tweens.add({
        targets: arm,
        x: rest!.x + (style === "punch" ? 24 : 4),
        angle: style === "blade" ? 65 : style === "slam" ? 55 : cast ? 15 : -42,
        duration: travel,
        ease: "Cubic.easeIn",
      });
    scene.tweens.add({
      targets: source,
      x: cast ? origin.x + direction * 5 : target.x - direction * (style === "blade" ? 100 : 88),
      y: origin.y,
      angle: origin.angle + direction * (cast ? 3 : 9),
      duration: travel,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (comboHold && arm)
          scene.tweens.add({
            targets: arm,
            angle: -50,
            duration: 95,
            yoyo: true,
          });
        scene.time.delayedCall(comboHold, () => {
          scene.tweens.add({ targets: source, ...origin, duration: 240, ease: "Sine.easeInOut" });
          if (arm) scene.tweens.add({ targets: arm, ...rest, duration: 190 });
          if (rear) scene.tweens.add({ targets: rear, angle: 0, duration: 190 });
        });
      },
    });
  });
}
