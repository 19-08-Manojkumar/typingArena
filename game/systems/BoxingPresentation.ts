import type { AttackPresentation } from "@/game/systems/AttackPresentation";

export function boxingPresentation(move: string, accuracy = 100): AttackPresentation {
  const power = move === "uppercut" || move === "counter" || move === "flurry";
  return {
    abilityId: `boxing-${move}`,
    fighterId: "boxer",
    tier: power ? "special" : "basic",
    quality: accuracy / 100,
    intensity: power ? 1.5 : 0.75,
    units: move === "flurry" ? 3 : move === "cross" ? 2 : 1,
    impactMs: move === "flurry" ? 720 : move === "cross" ? 410 : power ? 350 : 260,
    durationMs: move === "flurry" ? 1080 : 720,
    rating: accuracy >= 95 ? "PERFECT" : accuracy >= 80 ? "POWERFUL" : "PRECISE",
  };
}
