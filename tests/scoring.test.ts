import { describe, expect, it } from "vitest";
import {
  acceleration,
  aiPace,
  calculateAccuracy,
  calculateDamage,
  calculateWpm,
  clamp,
  levelForXp,
  rewardXp,
} from "@/lib/scoring";
describe("scoring", () => {
  it("uses five characters per word and active minutes", () => {
    expect(calculateWpm(250, 60000)).toBe(50);
    expect(calculateWpm(100, 0)).toBe(0);
  });
  it("defines accuracy from every printable attempt", () => {
    expect(calculateAccuracy(9, 10)).toBe(90);
    expect(calculateAccuracy(0, 0)).toBe(100);
  });
  it("caps speed damage and rewards accurate play", () => {
    expect(calculateDamage(20, 100, 100, 0)).toBe(calculateDamage(20, 100, 999, 0));
    expect(calculateDamage(20, 100, 40, 0)).toBeGreaterThan(calculateDamage(20, 30, 40, 0));
  });
  it("bounds resources and rejects nonfinite values", () => {
    expect(clamp(-3, 0, 100)).toBe(0);
    expect(clamp(120, 0, 100)).toBe(100);
    expect(clamp(NaN, 0, 100)).toBe(0);
  });
  it("balances acceleration, AI and progression", () => {
    expect(acceleration(100, 40)).toBeGreaterThan(acceleration(50, 0));
    expect(aiPace("hard")).toBeGreaterThan(aiPace("easy"));
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(720)).toBe(3);
    expect(rewardXp({ correct: 100, accuracy: 100 }, true)).toBeGreaterThan(
      rewardXp({ correct: 100, accuracy: 100 }, false),
    );
  });
});
