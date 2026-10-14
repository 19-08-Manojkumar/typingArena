import { describe, expect, it } from "vitest";
import { characters } from "@/game/data/characters";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { attackPresentation } from "@/game/systems/AttackPresentation";
import { abilityShortcut } from "@/lib/shortcuts";
import { BattleSession } from "@/game/systems/BattleSession";

describe("five battle powers", () => {
  it("preserves original moves, inserts an advanced move and adds an affordable supreme", () => {
    const originals = [
      ["quick-strike", "shadow-clone", "energy-sphere"],
      ["sword-slash", "rapid-blade", "phantom-strike"],
      ["shadow-strike", "shadow-summon", "shadow-army"],
      ["heavy-punch", "power-smash", "finisher"],
    ];
    for (const [index, fighter] of characters.entries()) {
      expect(fighter.abilities.map((ability) => ability.tier)).toEqual([
        "basic",
        "special",
        "advanced",
        "ultimate",
        "finisher",
      ]);
      expect([0, 1, 3].map((slot) => fighter.abilities[slot].id)).toEqual(originals[index]);
      fighter.abilities.forEach((ability, slot) => {
        expect(ability.cost).toBeLessThanOrEqual(fighter.energy);
        if (slot > 0) {
          expect(ability.damage).toBeGreaterThan(fighter.abilities[slot - 1].damage);
          expect(ability.cost).toBeGreaterThan(fighter.abilities[slot - 1].cost);
        }
      });
    }
  });

  it("casts every added power once, charges its cost and applies damage at its impact", () => {
    for (const fighter of characters)
      for (const slot of [2, 4]) {
        const system = new CombatSystem(fighter, characters[3], "hard");
        const ability = fighter.abilities[slot];
        expect(system.canUse(ability)).toBe(false);
        system.charge(1000);
        const initial = system.enemyHealth;
        const damage = system.resolve("power", ability, { accuracy: 95, wpm: 65, combo: 3 });
        const plan = system.effect.presentation!;
        expect(damage).toBeGreaterThan(0);
        expect(system.energy).toBe(fighter.energy - ability.cost);
        expect(system.enemyHealth).toBe(initial);
        system.update((plan.impactMs - 1) / 1000);
        expect(system.enemyHealth).toBe(initial);
        system.update(0.002);
        expect(system.enemyHealth).toBe(initial - damage);
        expect(system.canUse(ability)).toBe(false);
        system.update(1);
        expect(system.damageDealt).toBe(damage);
        expect(system.resolve("power", ability, { accuracy: 100, wpm: 90, combo: 10 })).toBe(0);
        if (slot === 4) {
          const ultimate = attackPresentation(fighter.abilities[3], fighter.id, 95, 65);
          expect(plan.intensity).toBeGreaterThan(ultimate.intensity);
          expect(plan.units).toBeGreaterThan(ultimate.units);
        }
      }
  });

  it("queues a selected power during typing without losing the current sentence", () => {
    const session = new BattleSession(characters[2], characters[3], "easy", 1, 0);
    for (let i = 0; i < 30; i++) session.step(100);
    session.combat.charge(1000);
    const passage = session.engine.snapshot().passage;
    session.key(passage[0]);
    expect(session.select(characters[2].abilities[4])).toBe(true);
    expect(session.engine.snapshot().position).toBe(1);
    expect(session.activeAbility.tier).toBe("basic");
    for (const key of passage.slice(1)) {
      session.step(50);
      session.key(key);
    }
    for (let i = 0; i < 8; i++) session.step(100);
    expect(session.activeAbility.tier).toBe("finisher");
    expect(session.engine.snapshot().position).toBe(0);
    expect(session.engine.snapshot().passage).not.toBe(passage);
  });
});

describe("battle keyboard shortcuts", () => {
  const event = {
    code: "Digit1",
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    repeat: false,
  };
  it("supports all five slots through Alt or Ctrl+Shift, including numpad", () => {
    for (let i = 1; i <= 5; i++) {
      expect(abilityShortcut({ ...event, code: `Digit${i}`, altKey: true })).toBe(i);
      expect(abilityShortcut({ ...event, code: `Digit${i}`, ctrlKey: true, shiftKey: true })).toBe(
        i,
      );
      expect(abilityShortcut({ ...event, code: `Numpad${i}`, altKey: true })).toBe(i);
    }
  });
  it("leaves regular text, browser tab shortcuts, AltGr and repeat events alone", () => {
    expect(abilityShortcut(event)).toBeNull();
    expect(abilityShortcut({ ...event, ctrlKey: true })).toBeNull();
    expect(abilityShortcut({ ...event, altKey: true, ctrlKey: true })).toBeNull();
    expect(abilityShortcut({ ...event, altKey: true, repeat: true })).toBeNull();
    expect(abilityShortcut({ ...event, code: "Digit6", altKey: true })).toBeNull();
  });
});
