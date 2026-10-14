import { describe, expect, it } from "vitest";
import { TypingEngine } from "@/game/systems/TypingEngine";

describe("shared typing engine", () => {
  it("validates every character and completes exactly once", () => {
    const engine = new TypingEngine("hi");
    let completions = 0;
    engine.subscribe((event) => {
      if (event.kind === "complete") completions++;
    });
    engine.start(0, 0);
    engine.handleKey("h", 500);
    expect(engine.snapshot().states).toEqual(["correct", "pending"]);
    engine.handleKey("x", 1000);
    engine.handleKey("i", 1500);
    expect(engine.snapshot().states).toEqual(["correct", "incorrect"]);
    expect(engine.snapshot().accuracy).toBe(50);
    expect(completions).toBe(1);
  });
  it("preserves incorrect attempts after correction and prevents reward farming", () => {
    const engine = new TypingEngine("cat");
    let rewards = 0;
    engine.subscribe((event) => {
      if (event.rewarded) rewards++;
    });
    engine.start(0, 0);
    engine.handleKey("c", 100);
    engine.handleKey("x", 200);
    engine.handleKey("Backspace", 300);
    engine.handleKey("Backspace", 400);
    engine.handleKey("c", 500);
    engine.handleKey("a", 600);
    engine.handleKey("t", 1000);
    expect(engine.snapshot().correct).toBe(3);
    expect(engine.snapshot().incorrect).toBe(1);
    expect(engine.snapshot().accuracy).toBe(80);
    expect(rewards).toBe(3);
  });
  it("tracks word combos and breaks them on mistakes", () => {
    const engine = new TypingEngine("hi my friend");
    engine.start(0, 0);
    [..."hi my "].forEach((key, i) => engine.handleKey(key, i * 100));
    expect(engine.snapshot().wordCombo).toBe(2);
    engine.handleKey("x", 700);
    expect(engine.snapshot().wordCombo).toBe(0);
    expect(engine.snapshot().bestWordCombo).toBe(2);
  });
  it("excludes countdown and pause time, and restarts cleanly", () => {
    const engine = new TypingEngine("hello world");
    engine.start(0);
    expect(engine.handleKey("h", 1000)).toBe(false);
    engine.tick(3000);
    engine.handleKey("h", 4000);
    engine.pause(5000);
    engine.tick(15000);
    engine.resume(20000);
    engine.tick(21000);
    expect(engine.snapshot().elapsed).toBe(3000);
    engine.start(22000, 0);
    expect(engine.snapshot().attempts).toBe(0);
    expect(engine.snapshot().position).toBe(0);
  });
  it("supports challenge timers, next passages, and listener cleanup", () => {
    const engine = new TypingEngine("a", 1000);
    let events = 0;
    const unsubscribe = engine.subscribe(() => events++);
    engine.start(0, 0);
    engine.handleKey("a", 100);
    engine.nextPassage("b");
    unsubscribe();
    engine.handleKey("b", 200);
    expect(events).toBe(2);
    expect(engine.snapshot().correct).toBe(2);
    engine.nextPassage("time");
    engine.tick(2000);
    expect(engine.snapshot().remaining).toBe(0);
    expect(engine.snapshot().status).toBe("complete");
  });
});
