import type { Difficulty, TypingStats } from "@/game/types/game.types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const calculateWpm = (correct: number, elapsedMs: number) =>
  elapsedMs > 0 ? Math.max(0, correct) / 5 / (elapsedMs / 60000) : 0;
export const calculateAccuracy = (correctAttempts: number, attempts: number) =>
  attempts > 0 ? clamp((correctAttempts / attempts) * 100, 0, 100) : 100;
export const calculateDamage = (
  base: number,
  accuracy: number,
  wpm: number,
  combo: number,
  power = 1,
) =>
  Math.round(
    Math.max(0, base) *
      (0.3 + (clamp(accuracy, 0, 100) / 100) * 0.7) *
      (0.85 + (clamp(wpm, 0, 100) / 100) * 0.45) *
      (1 + clamp(combo, 0, 8) * 0.025) *
      clamp(power, 0.5, 1.5),
  );
export const acceleration = (accuracy: number, streak: number, vehicle = 1) =>
  (4 + (clamp(accuracy, 0, 100) / 100) * 3) * (1 + clamp(streak, 0, 40) / 100) * vehicle;
export const aiPace = (difficulty: Difficulty) => ({ easy: 26, normal: 42, hard: 62 })[difficulty];
export const rewardXp = (stats: Pick<TypingStats, "correct" | "accuracy">, won: boolean) =>
  Math.round(35 + Math.min(stats.correct, 600) * 0.3 + stats.accuracy * 0.5 + (won ? 75 : 15));
export const levelForXp = (xp: number) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 180));
export const xpForLevel = (level: number) => Math.max(0, level - 1) ** 2 * 180;
