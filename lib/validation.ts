import type { Difficulty, GameResult, Mode } from "@/game/types/game.types";
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export const finite = (value: unknown, fallback = 0, min = 0, max = 1e9): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
export const isMode = (value: unknown): value is Mode =>
  value === "racing" || value === "battle" || value === "combat";
export const isDifficulty = (value: unknown): value is Difficulty =>
  value === "easy" || value === "normal" || value === "hard";
export function validateResult(value: unknown): GameResult | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isMode(value.mode) ||
    typeof value.won !== "boolean" ||
    typeof value.date !== "string" ||
    !Number.isFinite(Date.parse(value.date))
  )
    return null;
  return {
    id: value.id.slice(0, 100),
    mode: value.mode,
    won: value.won,
    date: value.date,
    duration: finite(value.duration),
    xp: finite(value.xp, 0, 0, 500),
    correct: finite(value.correct),
    incorrect: finite(value.incorrect),
    attempts: finite(value.attempts),
    accuracy: finite(value.accuracy, 0, 0, 100),
    wpm: finite(value.wpm, 0, 0, 1000),
    elapsed: finite(value.elapsed),
    streak: finite(value.streak),
    bestStreak: finite(value.bestStreak),
    wordCombo: finite(value.wordCombo),
    bestWordCombo: finite(value.bestWordCombo),
    ...(typeof value.position === "number"
      ? { position: Math.round(finite(value.position, 4, 1, 4)) }
      : {}),
    ...(typeof value.damage === "number" ? { damage: finite(value.damage) } : {}),
    ...(typeof value.rounds === "number" ? { rounds: finite(value.rounds, 1, 1, 3) } : {}),
    ...(Array.isArray(value.roundScores)
      ? {
          roundScores: value.roundScores
            .filter(isRecord)
            .slice(0, 3)
            .map((score) => ({
              round: finite(score.round, 1, 1, 3),
              dealt: finite(score.dealt),
              taken: finite(score.taken),
              won: score.won === true,
            })),
        }
      : {}),
  };
}
