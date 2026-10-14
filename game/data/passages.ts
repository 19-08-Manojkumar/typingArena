import type { Difficulty, PassageLength } from "@/game/types/game.types";

const passages: Record<Difficulty, string[]> = {
  easy: [
    "find your pace and keep your eyes on the road",
    "the night is still but the city never sleeps",
    "small steps and steady hands can win the race",
    "trust your rhythm and let the engine sing",
    "take a breath and make every move count",
    "a calm mind is the heart of a strong fighter",
  ],
  normal: [
    "Neon lights trace the skyline as the engines begin to roar.",
    "Keep your focus on the next turn. Precision builds momentum.",
    "A steady rhythm will carry you further than a reckless sprint.",
    "The arena falls silent. One perfect strike can change everything.",
    "Find the opening, trust your training, and commit to the moment.",
    "Rain glimmers on the asphalt while the city races past.",
  ],
  hard: [
    'At 2:45 AM, the challenger whispered: "Precision beats panic!"',
    "Velocity isn't everything; timing, accuracy, and control win races.",
    "A 97% success rate demands discipline - especially under pressure.",
    "Three rivals, two corners, one chance: don't break your rhythm.",
    "The fighter's counterattack was swift (and perfectly calculated).",
    "Shift, accelerate, recover; each split-second decision matters.",
  ],
};
export function getPassage(
  difficulty: Difficulty,
  length: PassageLength = "medium",
  index = 0,
): string {
  const pool = passages[difficulty];
  const count = { short: 1, medium: 2, long: 3 }[length];
  return Array.from({ length: count }, (_, offset) => pool[(index + offset) % pool.length]).join(
    " ",
  );
}
