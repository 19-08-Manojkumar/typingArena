import type { GameResult, PlayerProfile } from "@/game/types/game.types";
import { levelForXp } from "@/lib/scoring";
import { finite, isDifficulty, isMode, isRecord, validateResult } from "@/lib/validation";

export const STORAGE_KEY = "typing-arena:v1";
export const HISTORY_LIMIT = 25;
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function defaultProfile(): PlayerProfile {
  return {
    version: 1,
    displayName: "Challenger",
    xp: 0,
    level: 1,
    bestWpm: 0,
    bestAccuracy: 0,
    raceHistory: [],
    battleHistory: [],
    unlockedVehicles: ["pulse", "specter", "ignition"],
    unlockedCharacters: [
      "ninja",
      "swordsman",
      "hunter",
      "brawler",
      "solar",
      "storm",
      "crystal",
      "ember",
    ],
    achievements: [],
    settings: { sound: true, volume: 0.35, difficulty: "normal", reducedMotion: false },
    preferredMode: "racing",
  };
}
function history(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(validateResult)
        .filter((v): v is GameResult => v !== null)
        .slice(0, HISTORY_LIMIT)
    : [];
}
export function validateProfile(value: unknown): PlayerProfile {
  const fallback = defaultProfile();
  if (!isRecord(value) || (value.version !== undefined && value.version !== 1)) return fallback;
  const settings = isRecord(value.settings) ? value.settings : {};
  const xp = finite(value.xp);
  const level = levelForXp(xp);
  return {
    ...fallback,
    xp,
    level,
    displayName:
      typeof value.displayName === "string" && value.displayName.trim()
        ? value.displayName.trim().slice(0, 24)
        : fallback.displayName,
    bestWpm: finite(value.bestWpm, 0, 0, 1000),
    bestAccuracy: finite(value.bestAccuracy, 0, 0, 100),
    raceHistory: history(value.raceHistory).filter((r) => r.mode === "racing"),
    battleHistory: history(value.battleHistory).filter((r) => r.mode !== "racing"),
    unlockedVehicles:
      level >= 3 ? [...fallback.unlockedVehicles, "aurora"] : fallback.unlockedVehicles,
    achievements: Array.isArray(value.achievements)
      ? value.achievements.filter(
          (v): v is string =>
            typeof v === "string" &&
            ["first-win", "precision", "speedster", "all-rounder"].includes(v),
        )
      : [],
    preferredMode: isMode(value.preferredMode) ? value.preferredMode : "racing",
    settings: {
      sound: typeof settings.sound === "boolean" ? settings.sound : true,
      volume: finite(settings.volume, 0.35, 0, 1),
      difficulty: isDifficulty(settings.difficulty) ? settings.difficulty : "normal",
      reducedMotion: typeof settings.reducedMotion === "boolean" ? settings.reducedMotion : false,
    },
  };
}
export function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
export function loadProfile(storage: StorageLike | undefined = browserStorage()): {
  profile: PlayerProfile;
  warning: string | null;
} {
  if (!storage)
    return {
      profile: defaultProfile(),
      warning: "Storage is unavailable. Progress will last for this session.",
    };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { profile: raw ? validateProfile(JSON.parse(raw)) : defaultProfile(), warning: null };
  } catch {
    return {
      profile: defaultProfile(),
      warning: "Your save could not be read. A fresh session is ready.",
    };
  }
}
export function saveProfile(
  profile: PlayerProfile,
  storage: StorageLike | undefined = browserStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(validateProfile(profile)));
    return true;
  } catch {
    return false;
  }
}
export function applyResult(profile: PlayerProfile, result: GameResult): PlayerProfile {
  if ([...profile.raceHistory, ...profile.battleHistory].some((r) => r.id === result.id))
    return profile;
  const xp = profile.xp + result.xp;
  const raceHistory =
    result.mode === "racing"
      ? [result, ...profile.raceHistory].slice(0, HISTORY_LIMIT)
      : profile.raceHistory;
  const battleHistory =
    result.mode !== "racing"
      ? [result, ...profile.battleHistory].slice(0, HISTORY_LIMIT)
      : profile.battleHistory;
  const achievements = new Set(profile.achievements);
  if (result.won) achievements.add("first-win");
  if (result.accuracy >= 98 && result.correct >= 50) achievements.add("precision");
  if (result.wpm >= 60 && result.correct >= 50) achievements.add("speedster");
  if (new Set([...raceHistory, ...battleHistory].map((r) => r.mode)).size === 3)
    achievements.add("all-rounder");
  return validateProfile({
    ...profile,
    xp,
    raceHistory,
    battleHistory,
    preferredMode: result.mode,
    bestWpm: Math.max(profile.bestWpm, result.wpm),
    bestAccuracy: Math.max(profile.bestAccuracy, result.accuracy),
    achievements: [...achievements],
  });
}
