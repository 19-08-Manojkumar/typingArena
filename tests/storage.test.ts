import { describe, expect, it } from "vitest";
import {
  applyResult,
  defaultProfile,
  loadProfile,
  saveProfile,
  validateProfile,
  type StorageLike,
} from "@/lib/storage";
import type { GameResult } from "@/game/types/game.types";
const result: GameResult = {
  id: "1",
  mode: "racing",
  won: true,
  date: "2026-10-13T00:00:00Z",
  duration: 30000,
  xp: 100,
  correct: 100,
  incorrect: 0,
  attempts: 100,
  accuracy: 100,
  wpm: 40,
  elapsed: 30000,
  streak: 100,
  bestStreak: 100,
  wordCombo: 20,
  bestWordCombo: 20,
};
describe("storage recovery", () => {
  it("handles corrupted JSON, denied access and quota errors", () => {
    const broken: StorageLike = {
      getItem: () => "{bad",
      setItem: () => {
        throw Error("quota");
      },
      removeItem: () => {},
    };
    expect(loadProfile(broken).profile.level).toBe(1);
    expect(loadProfile(broken).warning).toBeTruthy();
    expect(saveProfile(defaultProfile(), broken)).toBe(false);
    expect(
      loadProfile({
        ...broken,
        getItem: () => {
          throw Error("blocked");
        },
      }).profile.xp,
    ).toBe(0);
  });
  it("migrates missing fields and sanitizes invalid fields", () => {
    const p = validateProfile({
      displayName: "  Pilot  ",
      xp: 720,
      bestAccuracy: 200,
      settings: { volume: -1 },
      raceHistory: [null, { id: "x" }],
    });
    expect(p.displayName).toBe("Pilot");
    expect(p.level).toBe(3);
    expect(p.bestAccuracy).toBe(100);
    expect(p.settings.volume).toBe(0);
    expect(p.raceHistory).toEqual([]);
    expect(p.unlockedVehicles).toContain("aurora");
    expect(validateProfile({ version: 99 }).xp).toBe(0);
  });
  it("applies each result once and bounds history", () => {
    let p = applyResult(defaultProfile(), result);
    expect(applyResult(p, result).xp).toBe(100);
    for (let i = 2; i < 40; i++) p = applyResult(p, { ...result, id: String(i) });
    expect(p.raceHistory).toHaveLength(25);
    expect(p.achievements).toContain("first-win");
  });
});
