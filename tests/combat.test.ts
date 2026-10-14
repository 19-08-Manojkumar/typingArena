import { describe, expect, it } from "vitest";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { BattleSession } from "@/game/systems/BattleSession";
import { characters } from "@/game/data/characters";
const performance = { accuracy: 100, wpm: 60, combo: 5 };
describe("anime combat", () => {
  it("supports every fighter and resolves each challenge once", () => {
    for (const player of characters) {
      const system = new CombatSystem(player, characters[0], "easy");
      const ability = player.abilities[0];
      expect(system.resolve("a", ability, performance)).toBeGreaterThan(0);
      expect(system.resolve("a", ability, performance)).toBe(0);
    }
  });
  it("enforces energy costs, caps, cooldowns, and ownership", () => {
    const system = new CombatSystem(characters[0], characters[1], "normal");
    const special = characters[0].abilities[1];
    expect(system.resolve("a", special, performance)).toBe(0);
    system.charge(10000);
    expect(system.energy).toBe(characters[0].energy);
    expect(system.resolve("b", special, performance)).toBeGreaterThan(0);
    expect(system.energy).toBe(characters[0].energy - special.cost);
    expect(system.resolve("c", special, performance)).toBe(0);
    system.update(8);
    expect(system.canUse(special)).toBe(true);
    expect(system.canUse(characters[1].abilities[0])).toBe(false);
    system.charge(-10000);
    expect(system.energy).toBe(0);
  });
  it("has deterministic opponent pressure and bounded health", () => {
    const system = new CombatSystem(characters[0], characters[3], "hard");
    for (let i = 0; i < 1000; i++) system.update(0.1);
    expect(system.health).toBe(0);
    expect(system.finished).toBe(true);
    expect(system.won).toBe(false);
  });
  it("produces a victory from completed typing challenges and supports queued specials", () => {
    const session = new BattleSession(characters[0], characters[1], "easy");
    for (let i = 0; i < 30; i++) session.step(100);
    let ticks = 0;
    while (!session.result && ticks++ < 2000) {
      session.step(60);
      const snapshot = session.engine.snapshot();
      if (snapshot.status !== "running") continue;
      if (snapshot.position === 0 && session.combat.canUse(characters[0].abilities[1]))
        session.select(characters[0].abilities[1]);
      const current = session.engine.snapshot();
      session.key(current.passage[current.position]);
    }
    expect(session.result?.won).toBe(true);
    expect(session.combat.enemyHealth).toBe(0);
    expect(session.combat.health).toBeGreaterThan(0);
  });
});
