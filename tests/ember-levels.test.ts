import { describe, expect, it } from "vitest";
import { heroes, villains } from "@/game/data/characters";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { attackPresentation } from "@/game/systems/AttackPresentation";
import { emberPresentation } from "@/game/systems/EmberPresentation";

const ember = heroes.find((fighter) => fighter.id === "ember")!;

describe("Ember animation progression", () => {
  for (const ability of ember.abilities) {
    it(`${ability.name} grows with experience without changing combat`, () => {
      const snapshots = [1, 5, 20].map((level) => {
        const combat = new CombatSystem(ember, villains[3], "hard", level);
        combat.charge(1000);
        const damage = combat.resolve("level-check", ability, { accuracy: 95, wpm: 70, combo: 2 });
        const presentation = combat.effect.presentation!;
        expect(presentation.level).toBe(level);
        return {
          damage,
          energy: combat.energy,
          cooldown: combat.cooldown(ability),
          impactMs: presentation.impactMs,
          durationMs: presentation.durationMs,
          size: emberPresentation(presentation).size,
        };
      });
      expect(snapshots[1].size).toBeGreaterThan(snapshots[0].size);
      expect(snapshots[2].size).toBeGreaterThan(snapshots[1].size);
      const gameplay = snapshots.map((value) => ({
        damage: value.damage,
        energy: value.energy,
        cooldown: value.cooldown,
        impactMs: value.impactMs,
        durationMs: value.durationMs,
      }));
      expect(gameplay[1]).toEqual(gameplay[0]);
      expect(gameplay[2]).toEqual(gameplay[0]);
    });
  }

  it("increases size across five tiers and caps effects at very high levels", () => {
    const sizes = ember.abilities.map(
      (ability) => emberPresentation(attackPresentation(ability, "ember", 100, 100, 1)).size,
    );
    sizes.slice(1).forEach((size, i) => expect(size).toBeGreaterThan(sizes[i]));
    for (const ability of ember.abilities) {
      const at = (level: number) =>
        emberPresentation(attackPresentation(ability, "ember", 100, 100, level));
      expect(at(500)).toEqual(at(20));
      expect(at(-1)).toEqual(at(1));
      expect(at(Number.NaN)).toEqual(at(1));
    }
  });
});
