import { describe, expect, it } from "vitest";
import { characters } from "@/game/data/characters";
import { BattlePassageDeck } from "@/game/systems/BattlePassageDeck";
import { ChallengeDeck } from "@/game/data/challenges";
import { battleActions } from "@/game/data/battlePassageParts";
import type { Difficulty } from "@/game/types/game.types";

describe("fresh practice for every hero and villain attack", () => {
  for (const difficulty of ["easy", "normal", "hard"] as Difficulty[]) {
    it(`${difficulty}: serves 1024 different passages for each of all 40 attacks`, () => {
      for (const fighter of characters)
        for (const ability of fighter.abilities) {
          expect(battleActions[ability.id]?.length).toBeGreaterThanOrEqual(4);
          const deck = new ChallengeDeck(123);
          const seen = new Set<string>();
          for (let i = 0; i < 1024; i++) {
            const passage = deck.battle(fighter.id, ability, difficulty);
            expect(seen.has(passage)).toBe(false);
            seen.add(passage);
            if (difficulty === "easy") expect(passage).toMatch(/^[a-z]+(?: [a-z]+)*$/);
            else expect(passage).toMatch(/^[A-Z].*\.$/);
          }
        }
    });
  }

  it("keeps independent progress when switching fighters, attacks, and difficulty", () => {
    const deck = new BattlePassageDeck(17);
    const seen = new Set<string>();
    for (let round = 0; round < 100; round++)
      for (const fighter of characters)
        for (const ability of fighter.abilities) {
          const text = deck.next(
            fighter.id,
            ability,
            (["easy", "normal", "hard"] as Difficulty[])[round % 3],
          );
          const canonical = text.toLowerCase().replace(/[^a-z ]/g, "");
          expect(seen.has(canonical)).toBe(false);
          seen.add(canonical);
        }
    expect(Object.keys(deck.snapshot().decks)).toHaveLength(120);
    expect(JSON.stringify(deck.snapshot()).length).toBeLessThan(24000);
  });

  it("restores every attack's position without replaying previous passages", () => {
    let deck = new BattlePassageDeck(7);
    const seen = new Set<string>();
    for (let round = 0; round < 6; round++) {
      for (const fighter of characters)
        for (const ability of fighter.abilities)
          for (let i = 0; i < 30; i++) {
            const text = deck.next(fighter.id, ability, "normal");
            expect(seen.has(text)).toBe(false);
            seen.add(text);
          }
      deck = new BattlePassageDeck(round + 1000, JSON.parse(JSON.stringify(deck.snapshot())));
    }
    expect(seen.size).toBe(7200);
  });

  it("visits the complete basic pool once and avoids an immediate repeat on refill", () => {
    const fighter = characters[0],
      ability = fighter.abilities[0];
    const deck = new BattlePassageDeck(0);
    const first = deck.next(fighter.id, ability, "normal");
    const size = deck.snapshot().decks[`${fighter.id}:${ability.id}:normal`].size;
    expect(size).toBeGreaterThanOrEqual(3000);
    const seen = new Set([first]);
    let last = first;
    for (let i = 1; i < size; i++) {
      last = deck.next(fighter.id, ability, "normal");
      expect(seen.has(last)).toBe(false);
      seen.add(last);
    }
    expect(seen.size).toBe(size);
    expect(deck.next(fighter.id, ability, "normal")).not.toBe(last);
  });

  it("ignores corrupt or incompatible saved progress and keeps seeded tests repeatable", () => {
    const fighter = characters[0],
      ability = fighter.abilities[0];
    for (const saved of [
      null,
      "broken",
      {},
      { version: 9, decks: {} },
      {
        version: 1,
        decks: { "ninja:quick-strike": { cursor: -1, offset: 0, step: 2, size: 10, last: 0 } },
      },
      {
        version: 1,
        decks: { "ninja:quick-strike": { cursor: 5, offset: 1, step: 3, size: 7, last: 4 } },
      },
    ]) {
      const deck = new BattlePassageDeck(0, saved);
      const a = deck.next(fighter.id, ability, "easy");
      expect(a).toMatch(/^[a-z ]+$/);
      expect(deck.next(fighter.id, ability, "easy")).not.toBe(a);
    }
    const a = new ChallengeDeck(19),
      b = new ChallengeDeck(19);
    for (let i = 0; i < 100; i++)
      expect(a.battle(fighter.id, ability, "normal")).toBe(b.battle(fighter.id, ability, "normal"));
  });
});
