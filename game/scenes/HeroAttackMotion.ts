import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";

import { emberPresentation } from "@/game/systems/EmberPresentation";

type Actor = Phaser.GameObjects.Container;
import { heroChoreography, type HeroPose } from "@/game/systems/HeroChoreography";

/** Pose holds only affect presentation; simulation, cooldowns and input keep their original clocks. */
export function heroHitStop(plan: AttackPresentation) {
  return { basic: 0, special: 32, advanced: 40, ultimate: 52, finisher: 64 }[plan.tier];
}

export function heroAttackMotion(
  scene: Phaser.Scene,
  source: Actor,
  target: Actor,
  plan: AttackPresentation,
) {
  const frames = heroChoreography(plan, Math.abs(target.x - source.x), heroHitStop(plan));
  if (!frames.length) return;
  const d = source.scaleX < 0 ? -1 : 1;
  const origin = { x: source.x, y: source.y, angle: source.angle };
  const names = ["lead-arm", "rear-arm", "hero-lead-leg", "hero-rear-leg", "hero-cape"];
  const joints = names.map((name) => source.getByName(name) as Actor);
  const homes = joints.map((joint) => ({ x: joint.x, y: joint.y, angle: joint.angle }));
  const restore = () => {
    if (!source.active) return;
    source.setPosition(origin.x, origin.y).setAngle(origin.angle);
    joints.forEach((joint, i) =>
      joint.setPosition(homes[i].x, homes[i].y).setAngle(homes[i].angle),
    );
  };
  scene.tweens.addCounter({
    from: 0,
    to: plan.durationMs - 40,
    duration: plan.durationMs - 40,
    onUpdate: (tween) => {
      if (!source.active) return;
      const ms = Number(tween.getValue());
      const next = frames.findIndex((frame) => frame.at > ms);
      const b = frames[next < 0 ? frames.length - 1 : next];
      const a = frames[next === 0 ? 0 : next < 0 ? frames.length - 1 : next - 1];
      const t = a === b ? 1 : Math.max(0, Math.min(1, (ms - a.at) / (b.at - a.at)));
      const eased =
        b.ease === "in" ? t * t * t : b.ease === "out" ? 1 - (1 - t) ** 3 : t * t * (3 - 2 * t);
      const value = (key: keyof HeroPose) => a.pose[key] + (b.pose[key] - a.pose[key]) * eased;
      const preparing = ms > 150 && ms < plan.impactMs - 300;
      const breath = preparing
        ? Math.sin(Math.PI * Math.min(1, (ms - 150) / 300)) * Math.sin(ms / 105)
        : 0;
      source
        .setPosition(origin.x + d * value("x"), origin.y + value("y") + breath * 1.5)
        .setAngle(origin.angle + d * value("tilt"));
      joints[0]
        .setPosition(homes[0].x + value("reach"), homes[0].y)
        .setAngle(homes[0].angle + value("arm"));
      joints[1]
        .setPosition(homes[1].x + value("guard"), homes[1].y)
        .setAngle(homes[1].angle + value("rear"));
      joints[2].angle = homes[2].angle - value("step");
      joints[3].angle = homes[3].angle + value("step") * 0.7;
      joints[4].angle = homes[4].angle + value("cape") + breath * 3;
      if (ms >= frames.at(-1)!.at) {
        restore();
      }
    },
    onComplete: restore,
  });
}

export function heroImpact(
  scene: Phaser.Scene,
  source: Actor,
  target: Actor,
  color: number,
  plan: AttackPresentation,
) {
  if (plan.tier === "basic" && plan.fighterId !== "ember") {
    const flash = scene.add
      .graphics()
      .setPosition(target.x, 226)
      .setDepth(9)
      .setName("hero-hit-flash")
      .setScale(0.2);
    flash.fillStyle(0xfff6df, 0.85).fillPoints(
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
    flash.lineStyle(2, color, 0.65).strokeCircle(0, 0, 18);
    scene.tweens.add({
      targets: flash,
      scale: 1.1,
      alpha: 0,
      duration: 230,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }
  const d = source.scaleX < 0 ? -1 : 1;
  const home = { x: target.x, y: target.y, angle: target.angle, alpha: target.alpha };
  const freeze = heroHitStop(plan);
  const ember = plan.fighterId === "ember" ? emberPresentation(plan) : null;
  const lift =
    plan.abilityId === "blazing-uppercut"
      ? 38 * (ember?.growth ?? 1)
      : Math.min(9, plan.intensity * 3);
  const knockback = ember
    ? (plan.abilityId === "phoenix-rush" ? 21 : 7 + ember.rank * 3) * ember.growth
    : Math.min(18, 5 + plan.intensity * 4);
  const duration = freeze + 300;
  scene.tweens.addCounter({
    from: 0,
    to: duration,
    duration,
    onUpdate: (tween) => {
      if (!target.active) return;
      const ms = Number(tween.getValue());
      const t = Math.max(0, (ms - freeze) / 300);
      const recoil = (1 - t) ** 2;
      target.setPosition(home.x + d * knockback * recoil, home.y - lift * recoil);
      target.angle = home.angle + d * Math.min(12, 4 + plan.intensity * 3) * recoil;
      target.alpha = home.alpha * (1 - 0.25 * Math.max(0, 1 - ms / 110));
    },
    onComplete: () => {
      if (target.active)
        target.setPosition(home.x, home.y).setAngle(home.angle).setAlpha(home.alpha);
    },
  });
  if (plan.tier !== "basic")
    scene.cameras.main.shake(
      plan.tier === "finisher" ? 125 : 70,
      Math.min(0.003, plan.intensity * 0.001),
    );
}
