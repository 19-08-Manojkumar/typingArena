import { describe, expect, it } from "vitest";
import { RacingSystem } from "@/game/systems/RacingSystem";
import { RacingSession } from "@/game/systems/RacingSession";
import { vehicles } from "@/game/data/vehicles";
describe("racing", () => {
  it("does not move the player without typing, while AI advances", () => {
    const race = new RacingSystem(vehicles[0], 800, "normal");
    race.update(1);
    expect(race.position).toBe(0);
    expect(race.opponents[0].position).toBeGreaterThan(0);
  });
  it("accelerates on typing and penalizes mistakes", () => {
    const race = new RacingSystem(vehicles[0], 800, "normal");
    race.correct({ accuracy: 100, streak: 15 });
    const speed = race.speed;
    race.update(0.1);
    expect(race.position).toBeGreaterThan(0);
    race.mistake();
    expect(race.speed).toBeLessThan(speed);
  });
  it("requires a full meter and cannot activate nitro repeatedly", () => {
    const race = new RacingSystem(vehicles[0], 800, "easy");
    expect(race.activateNitro()).toBe(false);
    for (let i = 0; i < 40; i++) race.correct({ accuracy: 100, streak: 20 });
    expect(race.nitro).toBe(100);
    expect(race.activateNitro()).toBe(true);
    expect(race.activateNitro()).toBe(false);
    expect(race.nitro).toBe(0);
  });
  it("finishes at the line and freezes results", () => {
    const race = new RacingSystem(vehicles[0], 10, "easy");
    for (let i = 0; i < 15; i++) race.correct({ accuracy: 100, streak: i });
    race.update(0.2);
    expect(race.finished).toBe(true);
    expect(race.position).toBe(10);
    const position = race.position;
    race.update(1);
    expect(race.position).toBe(position);
  });
  it("supports defeat, pause, and replay via a fresh session", () => {
    const session = new RacingSession(vehicles[0], 10, "easy", "short");
    for (let i = 0; i < 30; i++) session.step(100);
    session.pause();
    session.step(100);
    expect(session.race.position).toBe(0);
    expect(session.race.opponents[0].position).toBe(0);
    session.resume();
    for (let i = 0; i < 20; i++) session.step(100);
    expect(session.result?.won).toBe(false);
    expect(session.result?.position).toBe(4);
    expect(new RacingSession(vehicles[0], 10, "easy", "short").result).toBeNull();
  });
});
