import type { AttackPresentation } from "@/game/systems/AttackPresentation";

export function boxingPresentation(move: string, accuracy = 100): AttackPresentation {
  const power = move === "uppercut" || move === "counter";
  return {
    abilityId: `boxing-${move}`,
    fighterId: "boxer",
    tier: power ? "special" : "basic",
    quality: accuracy / 100,
    intensity: power ? 1.5 : 0.75,
    units: move === "cross" ? 2 : 1,
    impactMs: power ? 350 : 220,
    durationMs: 650,
    rating: accuracy >= 95 ? "PERFECT" : accuracy >= 80 ? "POWERFUL" : "PRECISE",
  };
}
