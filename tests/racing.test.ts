import { describe, expect, it } from "vitest";
import { RacingSystem } from "@/game/systems/RacingSystem";
import { RacingSession } from "@/game/systems/RacingSession";
import { vehicles } from "@/game/data/vehicles";
import { raceCamera, raceFeedback, raceViewportSize } from "@/game/systems/RacingPresentation";
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

  it("orders close finishes by crossing time, even when several cars finish in one frame", () => {
    const race = new RacingSystem(vehicles[0], 1000, "easy");
    race.position = 999;
    race.speed = 90;
    race.opponents[0].position = 999.3;
    race.opponents[1].position = 998.8;
    race.opponents[2].position = 999.9;
    race.update(0.1);
    expect(race.opponents.every((rival) => rival.position === 1000)).toBe(true);
    expect(race.finishTime).toBeLessThan(race.opponents[0].finishTime!);
    expect(race.finishTime).toBeLessThan(race.opponents[1].finishTime!);
    expect(race.finishTime).toBeGreaterThan(race.opponents[2].finishTime!);
    expect(race.place).toBe(2);
  });

  it("preserves an opponent's recorded finish time while the rest of the race continues", () => {
    const race = new RacingSystem(vehicles[0], 1000, "easy");
    race.opponents[0].position = 999.9;
    race.update(0.1);
    const finishedAt = race.opponents[0].finishTime;
    expect(finishedAt).not.toBeNull();
    race.update(1);
    expect(race.finished).toBe(false);
    expect(race.opponents[0].finishTime).toBe(finishedAt);
    expect(race.opponents[0].position).toBe(1000);
  });

  it("keeps nitro readiness consistent at rest, during a boost and after it expires", () => {
    const race = new RacingSystem(vehicles[1], 10000, "normal");
    race.nitro = 100;
    expect(race.canActivateNitro).toBe(false);
    expect(raceFeedback(race, "running").label).toBe("TYPE TO LAUNCH NITRO");
    race.correct({ accuracy: 100, streak: 10 });
    expect(race.canActivateNitro).toBe(true);
    expect(race.activateNitro()).toBe(true);
    expect(race.boostRemaining).toBe(5);
    race.nitro = 100;
    expect(race.canActivateNitro).toBe(false);
    expect(raceFeedback(race, "running").tone).toBe("boost");
    race.update(5.1);
    race.correct({ accuracy: 100, streak: 10 });
    expect(race.canActivateNitro).toBe(true);
  });

  it("freezes nitro and movement during pause and resumes them together", () => {
    const session = new RacingSession(vehicles[0], 10000, "easy", "long");
    for (let i = 0; i < 31; i++) session.step(100);
    for (let i = 0; i < 45; i++) {
      const snapshot = session.engine.snapshot();
      session.key(snapshot.passage[snapshot.position]);
    }
    expect(session.nitro()).toBe(true);
    session.pause();
    const before = { position: session.race.position, boost: session.race.boostRemaining };
    for (let i = 0; i < 20; i++) session.step(100);
    expect({ position: session.race.position, boost: session.race.boostRemaining }).toEqual(before);
    expect(session.nitro()).toBe(false);
    session.resume();
    session.step(100);
    expect(session.race.position).toBeGreaterThan(before.position);
    expect(session.race.boostRemaining).toBeLessThan(before.boost);
  });

  it("ignores invalid time steps and input after the race is finished", () => {
    const race = new RacingSystem(vehicles[0], 1000, "easy");
    race.update(-1);
    race.update(NaN);
    race.update(Infinity);
    expect(race.elapsed).toBe(0);
    expect(race.opponents[0].position).toBe(0);
    race.finished = true;
    race.speed = 20;
    race.nitro = 100;
    race.mistake();
    race.correct({ accuracy: 100, streak: 40 });
    expect(race.speed).toBe(20);
    expect(race.nitro).toBe(100);
    expect(race.mistakes).toBe(0);
    expect(race.activateNitro()).toBe(false);
  });

  it("keeps cars in view on both track sizes and brings the finish line to the player", () => {
    for (const width of [360, 600, 960, 2200]) {
      const view = raceCamera(width, 500, 800);
      expect(view.carX(0)).toBeGreaterThanOrEqual(60);
      expect(view.carX(5000)).toBeLessThanOrEqual(width - 68);
      expect(view.carX(500)).toBe(view.anchor);
      expect(view.finishX).toBeGreaterThan(view.anchor);
      expect(raceCamera(width, 800, 800).finishX).toBe(view.anchor);
    }
  });

  it("fills wide and narrow panels without stretching the racing world", () => {
    for (const [panelWidth, panelHeight] of [
      [1000, 280],
      [1800, 460],
      [366, 430],
      [800, 180],
    ]) {
      const world = raceViewportSize(panelWidth, panelHeight);
      const scale = Math.min(panelWidth / world.width, panelHeight / world.height);
      expect(world.width * scale).toBeCloseTo(panelWidth, 5);
      expect(world.height * scale).toBeLessThanOrEqual(panelHeight);
      const view = raceCamera(world.width, 0, 2200);
      expect(view.anchor - 50).toBeGreaterThan(0);
      expect(view.anchor + 50).toBeLessThan(world.width);
    }
    expect(raceViewportSize(1000, 0)).toEqual({ width: 960, height: 410 });
  });
});
