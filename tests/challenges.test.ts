import { describe, expect, it } from "vitest";
import { ChallengeDeck } from "@/game/data/challenges";
import { characters } from "@/game/data/characters";
import { BattleSession } from "@/game/systems/BattleSession";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { attackPresentation } from "@/game/systems/AttackPresentation";

describe("varied challenges and staged attacks", () => {
  it("generates 64 distinct prompts per fighter and ability before recycling", () => {
    for (const fighter of characters)
      for (const ability of fighter.abilities) {
        const deck = new ChallengeDeck(0);
        const prompts = Array.from({ length: 64 }, () =>
          deck.battle(fighter.id, ability, "normal"),
        );
        expect(new Set(prompts).size).toBe(64);
        expect(prompts.every((text) => text.endsWith("."))).toBe(true);
      }
  });
  it("varies boxing attacks and defensive prompts", () => {
    const deck = new ChallengeDeck(0);
    expect(new Set(Array.from({ length: 12 }, () => deck.boxing())).size).toBe(12);
    expect(new Set(Array.from({ length: 6 }, () => deck.defense("easy"))).size).toBe(6);
  });
  it("scales effects by ability tier, accuracy, speed, and player level", () => {
    const hunter = characters[2];
    const basic = attackPresentation(hunter.abilities[0], hunter.id, 100, 70);
    const summon = attackPresentation(hunter.abilities[1], hunter.id, 100, 70);
    const army = attackPresentation(hunter.abilities[3], hunter.id, 100, 70);
    expect(basic.intensity).toBeLessThan(summon.intensity);
    expect(summon.units).toBeLessThan(army.units);
    expect(army.intensity).toBeGreaterThan(
      attackPresentation(hunter.abilities[3], hunter.id, 50, 20).intensity,
    );
    expect(
      attackPresentation(hunter.abilities[3], hunter.id, 100, 70, 8).intensity,
    ).toBeGreaterThan(army.intensity);
  });
  it("reserves energy at cast, applies damage only at impact, and never twice", () => {
    const fighter = characters[2];
    const system = new CombatSystem(fighter, characters[3], "normal");
    system.charge(100);
    const health = system.enemyHealth;
    const damage = system.resolve("summon", fighter.abilities[1], {
      accuracy: 98,
      wpm: 60,
      combo: 4,
    });
    expect(system.enemyHealth).toBe(health);
    expect(system.effect.presentation?.abilityId).toBe("shadow-summon");
    expect(
      system.resolve("again", fighter.abilities[0], { accuracy: 100, wpm: 50, combo: 0 }),
    ).toBe(0);
    system.update(0.8);
    expect(system.enemyHealth).toBe(health);
    system.update(0.06);
    expect(system.enemyHealth).toBe(health - damage);
    system.update(0.5);
    expect(system.enemyHealth).toBe(health - damage);
    expect(
      system.resolve("summon", fighter.abilities[1], { accuracy: 100, wpm: 50, combo: 0 }),
    ).toBe(0);
  });
  it("requires a completed sentence before casting, pauses casts, then serves a fresh sentence", () => {
    const session = new BattleSession(characters[2], characters[3], "easy", 1, 0);
    for (let i = 0; i < 30; i++) session.step(100);
    const first = session.engine.snapshot().passage;
    session.select(characters[2].abilities[0]);
    expect(session.engine.snapshot().passage).toBe(first);
    for (const key of first.slice(0, -1)) {
      session.step(80);
      session.key(key);
    }
    expect(session.combat.effect.serial).toBe(0);
    session.key(first.at(-1)!);
    expect(session.combat.pendingAttack).not.toBeNull();
    const before = session.combat.enemyHealth;
    session.pause();
    for (let i = 0; i < 20; i++) session.step(100);
    expect(session.combat.enemyHealth).toBe(before);
    session.resume();
    for (let i = 0; i < 9; i++) session.step(100);
    expect(session.combat.enemyHealth).toBeLessThan(before);
    expect(session.engine.snapshot().passage).not.toBe(first);
    expect(session.engine.snapshot().status).toBe("running");
  });
});
