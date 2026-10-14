import { TypingEngine } from "@/game/systems/TypingEngine";
import type { GameResult, Mode } from "@/game/types/game.types";
import { rewardXp } from "@/lib/scoring";

export abstract class GameSession {
  readonly engine: TypingEngine;
  result: GameResult | null = null;
  protected clock = 0;
  private revision = 0;
  private lastPublish = 0;
  private listeners = new Set<() => void>();
  protected cleanup: (() => void) | undefined;
  constructor(
    readonly mode: Mode,
    passage: string,
  ) {
    this.engine = new TypingEngine(passage);
    this.engine.start(0);
  }
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  readonly getRevision = () => this.revision;
  protected publish() {
    this.revision++;
    this.listeners.forEach((listener) => listener());
  }
  step(delta: number) {
    if (this.result) return;
    const dt = Math.max(0, Math.min(delta, 100));
    this.clock += dt;
    const wasRunning = this.engine.snapshot().status === "running";
    this.engine.tick(this.clock);
    const status = this.engine.snapshot().status;
    if ((wasRunning && status === "running") || status === "complete") this.simulate(dt / 1000);
    if (this.clock - this.lastPublish >= 70) {
      this.lastPublish = this.clock;
      this.publish();
    }
  }
  key(key: string) {
    if (!this.result && this.engine.handleKey(key, this.clock)) this.publish();
  }
  pause() {
    if (!this.result) {
      this.engine.pause(this.clock);
      this.publish();
    }
  }
  resume() {
    if (!this.result) {
      this.engine.resume(this.clock);
      this.publish();
    }
  }
  protected finish(
    won: boolean,
    details: Partial<Pick<GameResult, "position" | "damage" | "rounds" | "roundScores">> = {},
  ) {
    if (this.result) return;
    this.engine.stop(this.clock);
    const stats = this.engine.snapshot();
    this.result = {
      ...stats,
      ...details,
      id: crypto.randomUUID(),
      mode: this.mode,
      won,
      date: new Date().toISOString(),
      duration: stats.elapsed,
      xp: rewardXp(stats, won),
    };
    this.publish();
  }
  abstract simulate(seconds: number): void;
  dispose() {
    this.cleanup?.();
    this.listeners.clear();
  }
}
