import { describe, expect, it } from "vitest";
import { BoxingSystem } from "@/game/systems/BoxingSystem";
import { BoxingSession } from "@/game/systems/BoxingSession";
const performance = { accuracy: 100, wpm: 50, combo: 4 };
describe("boxing framework", () => {
  it("spends stamina, applies combos once, and bounds resources", () => {
    const system = new BoxingSystem("easy");
    expect(system.resolve("a", performance)).toBeGreaterThan(0);
    expect(system.stamina).toBe(82);
    expect(system.resolve("a", performance)).toBe(0);
    expect(system.multiplier).toBe(1.1);
    system.stamina = 5;
    system.resolve("b", performance);
    expect(system.stamina).toBe(17);
    system.update(50);
    expect(system.stamina).toBeLessThanOrEqual(100);
  });
  it("offers timed defenses with accuracy-dependent protection", () => {
    const system = new BoxingSystem("normal");
    for (let i = 0; i < 71; i++) system.update(0.1);
    expect(system.defending).toBe(true);
    system.resolve("guard", performance);
    expect(system.health).toBe(150);
    expect(system.defending).toBe(false);
    for (let i = 0; i < 95; i++) system.update(0.1);
    expect(system.health).toBeLessThan(150);
  });
  it("records three rounds and resolves scorecards", () => {
    const system = new BoxingSystem("easy", 2);
    for (let i = 0; i < 200; i++) system.update(0.1);
    expect(system.roundScores).toHaveLength(3);
    expect(system.finished).toBe(true);
    expect(system.won).toBe(false);
  });
  it("can win by typing combinations and shares pause semantics", () => {
    const session = new BoxingSession("easy", 50);
    for (let i = 0; i < 30; i++) session.step(100);
    session.pause();
    const before = session.boxing.remaining;
    session.step(100);
    expect(session.boxing.remaining).toBe(before);
    session.resume();
    for (let i = 0; i < 1500 && !session.result; i++) {
      session.step(100);
      const snapshot = session.engine.snapshot();
      session.key(snapshot.passage[snapshot.position]);
    }
    expect(session.result?.won).toBe(true);
    expect(session.boxing.enemyHealth).toBe(0);
  });
});
