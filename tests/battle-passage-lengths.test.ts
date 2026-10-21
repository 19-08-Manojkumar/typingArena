import { describe, expect, it } from "vitest";
import { characters } from "@/game/data/characters";
import { BattlePassageDeck } from "@/game/systems/BattlePassageDeck";
import { shortBattleActions } from "@/game/data/battleShortPassageParts";

describe("difficulty-based battle passage lengths", () => {
  it("has four short, attack-specific actions for every hero and villain ability", () => {
    expect(Object.keys(shortBattleActions).sort()).toEqual(
      characters.flatMap((fighter) => fighter.abilities.map((ability) => ability.id)).sort(),
    );
    for (const actions of Object.values(shortBattleActions)) {
      expect(actions).toHaveLength(4);
      expect(new Set(actions).size).toBe(4);
      expect(Math.max(...actions.map((action) => action.length))).toBeLessThanOrEqual(24);
    }
  });

  it("keeps Easy to one short sentence, with only a brief extra phrase for finishers", () => {
    for (const fighter of characters)
      for (const ability of fighter.abilities) {
        const deck = new BattlePassageDeck(43);
        for (let i = 0; i < 128; i++) {
          const text = deck.next(fighter.id, ability, "easy");
          expect(text.length, ability.id).toBeLessThanOrEqual(
            ability.tier === "finisher" ? 64 : 48,
          );
          expect(text).toMatch(/^[a-z]+(?: [a-z]+)*$/);
          expect(text.split(" ").length).toBeLessThanOrEqual(ability.tier === "finisher" ? 16 : 12);
        }
      }
  });

  it("shortens Normal while retaining full Hard paragraphs", () => {
    for (const fighter of characters)
      for (const ability of fighter.abilities) {
        const deck = new BattlePassageDeck(71);
        const lengths = { easy: 0, normal: 0, hard: 0 };
        for (let i = 0; i < 128; i++)
          for (const difficulty of ["easy", "normal", "hard"] as const) {
            const text = deck.next(fighter.id, ability, difficulty);
            lengths[difficulty] += text.length;
            if (difficulty === "normal")
              expect(text.length, ability.id).toBeLessThanOrEqual(
                ability.tier === "finisher"
                  ? 190
                  : ability.tier === "basic" || ability.tier === "special"
                    ? 140
                    : 180,
              );
          }
        expect(lengths.easy).toBeLessThan(lengths.normal);
        if (ability.tier !== "basic") expect(lengths.normal).toBeLessThan(lengths.hard * 0.85);
      }
  });

  it("preserves old Hard progress while Easy and Normal keep independent saved draws", () => {
    const fighter = characters[0],
      ability = fighter.abilities[4];
    const old = new BattlePassageDeck(12);
    old.next(fighter.id, ability, "hard");
    const saved = old.snapshot();
    const resumed = new BattlePassageDeck(99, saved);
    const expected = old.next(fighter.id, ability, "hard");
    resumed.next(fighter.id, ability, "easy");
    resumed.next(fighter.id, ability, "normal");
    expect(resumed.next(fighter.id, ability, "hard")).toBe(expected);
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const restored = new BattlePassageDeck(2026, resumed.snapshot());
      expect(restored.next(fighter.id, ability, difficulty)).toBe(
        resumed.next(fighter.id, ability, difficulty),
      );
    }
  });
});
