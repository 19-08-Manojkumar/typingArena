export const boxingMoves = [
  { id: "jab", name: "Snap jab", cue: "Fast lead hand", charge: 0, extraStamina: 0, bonus: 1 },
  { id: "cross", name: "One-two", cue: "Jab → rear cross", charge: 0, extraStamina: 0, bonus: 1.1 },
  {
    id: "hook",
    name: "Body hook",
    cue: "Dip → turn through",
    charge: 0,
    extraStamina: 0,
    bonus: 1.12,
  },
  {
    id: "uppercut",
    name: "Power uppercut",
    cue: "Drive up the middle",
    charge: 3,
    extraStamina: 6,
    bonus: 1.6,
  },
  {
    id: "flurry",
    name: "Ringside flurry",
    cue: "Jab → cross → hook",
    charge: 3,
    extraStamina: 12,
    bonus: 1.85,
  },
] as const;

export type BoxingMoveId = (typeof boxingMoves)[number]["id"];
export type BoxingStrike = BoxingMoveId | "counter";
export const boxingMove = (id: BoxingMoveId) => boxingMoves.find((move) => move.id === id)!;
