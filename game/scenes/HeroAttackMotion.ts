import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";

import { emberPresentation } from "@/game/systems/EmberPresentation";

type Actor = Phaser.GameObjects.Container;
type Pose = {
  x: number;
  y: number;
  tilt: number;
  arm: number;
  rear: number;
  reach: number;
  step: number;
  cape: number;
};
type Move = {
  wind: Partial<Pose>;
  strike: Partial<Pose>;
  travel: number;
  releaseDuration?: number;
  gap?: number;
  lift?: number;
};

const rest: Pose = { x: 0, y: 0, tilt: 0, arm: 0, rear: 0, reach: 0, step: 0, cape: 0 };

// Angles are in rig-local space: mirroring the fighter also mirrors the weapon choreography.
const moves: Record<string, Move> = {
  "dawn-slash": {
    wind: { x: -14, tilt: -9, arm: -72, rear: -16, step: -7 },
    strike: { tilt: 10, arm: 62, rear: -25, step: 13, cape: -20 },
    travel: 135,
    gap: 103,
  },
  "aegis-charge": {
    wind: { x: -22, y: 5, tilt: -12, arm: -25, rear: -105, step: -12 },
    strike: { tilt: 14, arm: -42, rear: -132, step: 17, cape: -34 },
    travel: 235,
    gap: 64,
  },
  "sunlance-volley": {
    wind: { tilt: -4, arm: -63, rear: -42, cape: 8 },
    strike: { x: 13, tilt: 5, arm: -9, rear: -25, reach: 8, step: 5, cape: -16 },
    travel: 440,
    releaseDuration: 150,
  },
  "solar-judgement": {
    wind: { x: -12, y: 5, tilt: -9, arm: -112, rear: -30, step: -10 },
    strike: { tilt: 12, arm: 67, rear: -35, step: 15, cape: -28 },
    travel: 270,
    gap: 115,
    lift: -31,
  },
  "daybreak-ascension": {
    wind: { x: -9, y: 7, tilt: -6, arm: -100, rear: -45, step: -8 },
    strike: { x: 24, y: -26, tilt: -4, arm: -38, rear: -85, step: 7, cape: -24 },
    travel: 340,
    lift: -42,
  },
  "spark-arrow": {
    wind: { x: -7, tilt: -4, arm: -8, rear: -82, reach: -6, step: -5 },
    strike: { x: -12, tilt: -7, arm: -4, rear: -38, reach: 3, step: 5, cape: -11 },
    travel: 170,
    releaseDuration: 80,
  },
  "thunder-volley": {
    wind: { x: -10, y: 3, tilt: -5, arm: -20, rear: -96, step: -9 },
    strike: { x: -17, y: -9, tilt: -8, arm: 3, rear: -28, step: 12, cape: -22 },
    travel: 425,
    releaseDuration: 90,
    lift: -18,
  },
  "chain-lightning": {
    wind: { x: -6, tilt: -3, arm: -28, rear: -103, step: -6 },
    strike: { x: 7, tilt: 6, arm: -6, rear: -18, reach: 7, step: 8, cape: -18 },
    travel: 190,
    releaseDuration: 90,
  },
  "tempest-vortex": {
    wind: { x: -12, y: 5, tilt: -8, arm: -62, rear: -85, step: -8 },
    strike: { x: 18, y: -10, tilt: 9, arm: 18, rear: -28, step: 14, cape: -35 },
    travel: 310,
    releaseDuration: 100,
    lift: -24,
  },
  skybreaker: {
    wind: { x: -16, y: 4, tilt: -12, arm: -38, rear: -115, reach: -10, step: -12 },
    strike: { x: -22, y: -14, tilt: -13, arm: -17, rear: -25, reach: 8, step: 15, cape: -30 },
    travel: 330,
    releaseDuration: 100,
    lift: -30,
  },
  "prism-bolt": {
    wind: { x: -5, tilt: -5, arm: -27, rear: -24, step: -4 },
    strike: { x: 9, tilt: 5, arm: 21, rear: -52, reach: 7, step: 7, cape: -12 },
    travel: 160,
    releaseDuration: 90,
  },
  "crystal-bloom": {
    wind: { y: -7, tilt: -7, arm: -71, rear: -58, cape: 12 },
    strike: { x: 9, y: 6, tilt: 9, arm: 38, rear: -32, step: 10, cape: -19 },
    travel: 240,
  },
  "mirror-constellation": {
    wind: { x: -6, y: -6, tilt: -6, arm: -49, rear: -88, cape: 16 },
    strike: { x: 12, y: -5, tilt: 6, arm: 11, rear: -39, reach: 9, step: 7, cape: -18 },
    travel: 280,
    releaseDuration: 120,
  },
  "aurora-beam": {
    wind: { x: -13, tilt: -10, arm: -47, rear: -63, step: -10 },
    strike: { x: -5, tilt: -7, arm: 13, rear: -18, reach: 13, step: 15, cape: -32 },
    travel: 300,
    releaseDuration: 130,
  },
  "starlight-sanctuary": {
    wind: { y: -12, tilt: -4, arm: -86, rear: -104, cape: 19 },
    strike: { x: 8, y: -23, tilt: 4, arm: -29, rear: -60, step: 5, cape: -20 },
    travel: 360,
    lift: -32,
  },
};

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
  const move = moves[plan.abilityId];
  if (!move) return;
  const d = source.scaleX < 0 ? -1 : 1;
  const origin = { x: source.x, y: source.y, angle: source.angle };
  const arm = source.getByName("lead-arm") as Actor;
  const rear = source.getByName("rear-arm") as Actor;
  const leadLeg = source.getByName("hero-lead-leg") as Actor;
  const rearLeg = source.getByName("hero-rear-leg") as Actor;
  const cape = source.getByName("hero-cape") as Actor;
  const joints = [arm, rear, leadLeg, rearLeg, cape].filter(Boolean);
  const homes = joints.map((joint) => ({ x: joint.x, y: joint.y, angle: joint.angle }));
  const wind = { ...rest, ...move.wind };
  const strike = { ...rest, ...move.strike };
  if (move.gap) strike.x = Math.max(0, Math.abs(target.x - source.x) - move.gap);
  const release = plan.impactMs - move.travel;
  const strikeAt = release + (move.releaseDuration ?? move.travel);
  const freeze = heroHitStop(plan);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const apply = (a: Pose, b: Pose, t: number) => {
    const mix = (key: keyof Pose) => a[key] + (b[key] - a[key]) * t;
    source.setPosition(origin.x + d * mix("x"), origin.y + mix("y"));
    source.angle = origin.angle + d * mix("tilt");
    arm.setPosition(homes[0].x + mix("reach"), homes[0].y);
    arm.angle = homes[0].angle + mix("arm");
    rear.angle = homes[1].angle + mix("rear");
    if (leadLeg) leadLeg.angle = homes[2].angle - mix("step");
    if (rearLeg) rearLeg.angle = homes[3].angle + mix("step") * 0.7;
    if (cape) cape.angle = homes[4].angle + mix("cape");
  };
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
      const windup = Math.min(220, release * 0.75);
      if (ms < release) {
        apply(rest, wind, smooth(Math.min(1, ms / Math.max(1, windup))));
      } else if (ms < strikeAt) {
        const t = (ms - release) / (strikeAt - release);
        apply(wind, strike, t * t * t);
        source.y += Math.sin(t * Math.PI) * (move.lift ?? 0);
      } else if (ms < plan.impactMs + freeze) {
        apply(strike, strike, 1);
      } else {
        const t = Math.min(
          1,
          (ms - plan.impactMs - freeze) /
            Math.min(440, plan.durationMs - plan.impactMs - freeze - 60),
        );
        apply(strike, rest, smooth(t));
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
