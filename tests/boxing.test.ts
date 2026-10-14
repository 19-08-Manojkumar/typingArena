import { describe, expect, it } from "vitest";
import { BoxingSystem } from "@/game/systems/BoxingSystem";
import { BoxingSession } from "@/game/systems/BoxingSession";
const performance = { accuracy: 100, wpm: 50, combo: 4 };
describe("boxing framework", () => {
  it("gives practice players single words and never attacks", () => {
    const session = new BoxingSession("easy", 50, "practice");
    expect(session.engine.snapshot().passage).toMatch(/^[a-z]{2,5}$/);
    for (let i = 0; i < 400; i++) session.boxing.update(0.1);
    expect(session.boxing.defending).toBe(false);
    expect(session.boxing.health).toBe(150);
    expect(session.boxing.enemyHealth).toBe(75);
  });
  it("gives rookies a long defense window and gentle missed-block damage", () => {
    const system = new BoxingSystem("easy", 50, "rookie");
    system.update(13);
    expect(system.defending).toBe(false);
    system.update(1);
    expect(system.defending).toBe(true);
    expect(system.defenseRemaining).toBe(10);
    system.update(10);
    expect(system.health).toBe(146);
    expect(system.nextAttack).toBe(14);
    system.defending = true;
    system.resolve("guard", { ...performance, accuracy: 65 });
    expect(system.health).toBe(146);
    expect(system.counterReady).toBe(true);
  });
  it("lets a new typist win a quick rookie bout at about 10 WPM", () => {
    const session = new BoxingSession("easy", 25, "rookie");
    for (let tick = 0; tick < 1000 && !session.result; tick++) {
      session.step(100);
      if (tick % 12 !== 0) continue;
      const snapshot = session.engine.snapshot();
      if (snapshot.status === "running") session.key(snapshot.passage[snapshot.position]);
    }
    expect(session.result?.won).toBe(true);
    expect(session.result!.wpm).toBeLessThan(15);
    expect(session.boxing.health).toBeGreaterThan(100);
  });
  it("charges an uppercut with three clean combinations and consumes its bonus once", () => {
    const system = new BoxingSystem("easy", 50);
    for (let i = 0; i < 3; i++) {
      system.resolve(`punch-${i}`, performance);
      system.update(0.8);
    }
    expect(system.nextMove).toBe("uppercut");
    const health = system.enemyHealth;
    const damage = system.resolve("power", performance);
    expect(system.effect.presentation?.abilityId).toBe("boxing-uppercut");
    expect(system.enemyHealth).toBe(health - damage);
    expect(system.momentum).toBe(0);
    expect(system.resolve("power", performance)).toBe(0);
  });
  it("rewards a successful guard with one counter and preserves a charged uppercut", () => {
    const system = new BoxingSystem("normal");
    system.momentum = 3;
    system.defending = true;
    system.resolve("guard", performance);
    expect(system.nextMove).toBe("counter");
    expect(system.effect.presentation?.abilityId).toBe("boxing-guard");
    const ordinary = new BoxingSystem("normal").resolve("ordinary", performance);
    expect(system.resolve("counter", performance)).toBeGreaterThan(ordinary);
    expect(system.counterReady).toBe(false);
    expect(system.nextMove).toBe("uppercut");
    system.mistake();
    expect(system.momentum).toBe(0);
  });
  it("does not award a counter for a partial guard and resolves a lethal partial block", () => {
    const system = new BoxingSystem("hard");
    system.health = 4;
    system.defending = true;
    system.resolve("partial", { ...performance, accuracy: 70 });
    expect(system.counterReady).toBe(false);
    expect(system.finished).toBe(true);
    expect(system.won).toBe(false);
    expect(system.roundScores).toHaveLength(1);
  });
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
