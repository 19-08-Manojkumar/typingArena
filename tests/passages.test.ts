import { describe, expect, it } from "vitest";
import { RacingPassageDeck } from "@/game/data/passages";
import { RacingSession } from "@/game/systems/RacingSession";
import { vehicles } from "@/game/data/vehicles";
import type { Difficulty, PassageLength } from "@/game/types/game.types";

describe("racing passage variety", () => {
  for (const difficulty of ["easy", "normal", "hard"] as Difficulty[]) {
    it(`${difficulty}: serves 32 distinct sentences before recycling and changes on refill`, () => {
      const deck = new RacingPassageDeck(difficulty, () => 0.5);
      const sentences = Array.from({ length: 32 }, () => deck.next("short"));
      expect(new Set(sentences).size).toBe(32);
      expect(deck.snapshot().remaining).toHaveLength(0);
      expect(deck.next("short")).not.toBe(sentences.at(-1));
      if (difficulty === "easy")
        expect(sentences.every((text) => /^[a-z ]+$/.test(text))).toBe(true);
    });
    it(`${difficulty}: avoids duplicate and overlapping sentences for every passage length`, () => {
      const deck = new RacingPassageDeck(difficulty, () => 0.5);
      let previous: number[] = [];
      for (let round = 0; round < 80; round++) {
        const length = (["short", "medium", "long"] as PassageLength[])[round % 3];
        expect(deck.next(length).trim()).not.toBe("");
        const chosen = deck.snapshot().previous;
        expect(chosen.length).toBe({ short: 1, medium: 2, long: 3 }[length]);
        expect(new Set(chosen).size).toBe(chosen.length);
        expect(chosen.some((index) => previous.includes(index))).toBe(false);
        previous = chosen;
      }
    });
  }

  it("preserves unused sentences across reloads and safely ignores invalid saved decks", () => {
    const first = new RacingPassageDeck("easy", () => 0.5);
    const seen = Array.from({ length: 16 }, () => first.next("short"));
    const restored = new RacingPassageDeck(
      "easy",
      () => 0.5,
      JSON.parse(JSON.stringify(first.snapshot())),
    );
    const remaining = Array.from({ length: 16 }, () => restored.next("short"));
    expect(new Set([...seen, ...remaining]).size).toBe(32);
    for (const bad of [
      null,
      {},
      "broken",
      { remaining: [-1, 1000], previous: [2] },
      { remaining: [1, 1], previous: [] },
    ]) {
      expect(new RacingPassageDeck("easy", () => 0.5, bad).next("short")).toMatch(/^[a-z ]+$/);
    }
  });

  it("changes the completed prompt and preserves cumulative typing statistics", () => {
    const session = new RacingSession(vehicles[0], 2200, "easy", "medium");
    for (let i = 0; i < 31; i++) session.step(100);
    const first = session.engine.snapshot().passage;
    for (const key of first.slice(0, -1)) session.key(key);
    expect(session.engine.snapshot().passage).toBe(first);
    session.key(first.at(-1)!);
    const next = session.engine.snapshot();
    expect(next.passage).not.toBe(first);
    expect(next.position).toBe(0);
    expect(next.correct).toBe(first.length);
    expect(next.accuracy).toBe(100);
    expect(next.status).toBe("running");
    session.pause();
    session.step(100);
    session.resume();
    expect(session.engine.snapshot().passage).toBe(next.passage);
    const replay = new RacingSession(vehicles[0], 2200, "easy", "medium");
    expect(replay.engine.snapshot().passage).not.toBe(next.passage);
  });
});
