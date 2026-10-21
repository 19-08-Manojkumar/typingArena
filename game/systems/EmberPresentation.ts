import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { clamp } from "@/lib/scoring";

/** Visual growth only. Tier changes the silhouette; experience enlarges it without adding emitters. */
export function emberPresentation(plan: AttackPresentation) {
  const rank = ["basic", "special", "advanced", "ultimate", "finisher"].indexOf(plan.tier);
  const growth = 1 + Math.sqrt(clamp((plan.level ?? 1) - 1, 0, 19) / 19) * 0.4;
  return { rank, growth, size: [0.85, 1, 1.16, 1.34, 1.55][rank] * growth };
}
