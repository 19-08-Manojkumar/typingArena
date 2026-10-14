import type { Ability } from "@/game/types/game.types";
import { clamp } from "@/lib/scoring";
export interface AttackPresentation {
  abilityId: string;
  fighterId: string;
  tier: Ability["tier"];
  quality: number;
  intensity: number;
  units: number;
  impactMs: number;
  durationMs: number;
  rating: "PRECISE" | "POWERFUL" | "PERFECT";
}
export function attackPresentation(
  ability: Ability,
  fighterId: string,
  accuracy: number,
  wpm: number,
  level = 1,
): AttackPresentation {
  const quality = clamp((accuracy / 100) * 0.8 + (clamp(wpm, 0, 100) / 100) * 0.2, 0, 1);
  const strength = { basic: 0.55, special: 1, advanced: 1.3, ultimate: 1.65, finisher: 2.6 }[
    ability.tier
  ];
  return {
    abilityId: ability.id,
    fighterId,
    tier: ability.tier,
    quality,
    intensity: strength * (0.65 + quality * 0.45 + clamp(level - 1, 0, 10) * 0.012),
    units:
      ability.tier === "basic"
        ? 1
        : ability.tier === "special"
          ? 2 + Math.floor(quality * 2)
          : ability.tier === "advanced"
            ? 4 + Math.floor(quality * 3)
            : ability.tier === "ultimate"
              ? 6 + Math.floor(quality * 5)
              : 12 + Math.floor(quality * 8),
    impactMs: { basic: 300, special: 850, advanced: 1100, ultimate: 1500, finisher: 2200 }[
      ability.tier
    ],
    durationMs: { basic: 650, special: 1350, advanced: 1750, ultimate: 2300, finisher: 3200 }[
      ability.tier
    ],
    rating: quality >= 0.9 ? "PERFECT" : quality >= 0.7 ? "POWERFUL" : "PRECISE",
  };
}
