import { calculateAccuracy, calculateWpm } from "@/lib/scoring";
import type { TypingEvent, TypingSnapshot, TypingStatus } from "@/game/types/game.types";

/** Corrections remove submitted characters, never historical attempts or earned rewards.
 * Completion accepts errors; accuracy reduces rewards. WPM uses net correct characters
 * divided by five and active elapsed minutes. Pauses and countdowns are excluded. */
export class TypingEngine {
  private passage: string;
  private input = "";
  private status: TypingStatus = "idle";
  private previousStatus: TypingStatus = "running";
  private lastTime = 0;
  private elapsed = 0;
  private countdownMs = 0;
  private correctBefore = 0;
  private correctAttempts = 0;
  private attempts = 0;
  private streak = 0;
  private bestStreak = 0;
  private wordCombo = 0;
  private bestWordCombo = 0;
  private wordClean = true;
  private rewarded = new Set<number>();
  private listeners = new Set<(event: TypingEvent) => void>();
  constructor(
    passage: string,
    private limitMs: number | null = null,
  ) {
    this.passage = passage || "Ready to type.";
  }
  subscribe(listener: (event: TypingEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  start(now: number, countdownSeconds = 3) {
    this.input = "";
    this.elapsed = this.correctBefore = this.correctAttempts = this.attempts = 0;
    this.streak = this.bestStreak = this.wordCombo = this.bestWordCombo = 0;
    this.wordClean = true;
    this.rewarded.clear();
    this.lastTime = now;
    this.countdownMs = countdownSeconds * 1000;
    this.status = countdownSeconds > 0 ? "countdown" : "running";
  }
  tick(now: number) {
    const delta = Math.max(0, now - this.lastTime);
    this.lastTime = now;
    if (this.status === "countdown") {
      this.countdownMs = Math.max(0, this.countdownMs - delta);
      if (this.countdownMs === 0) this.status = "running";
    } else if (this.status === "running") {
      this.elapsed += delta;
      if (this.limitMs !== null && this.elapsed >= this.limitMs) {
        this.elapsed = this.limitMs;
        this.status = "complete";
      }
    }
  }
  pause(now: number) {
    this.tick(now);
    if (this.status === "running" || this.status === "countdown" || this.status === "complete") {
      this.previousStatus = this.status;
      this.status = "paused";
    }
  }
  resume(now: number) {
    if (this.status !== "paused") return;
    this.lastTime = now;
    this.status = this.previousStatus;
  }
  stop(now: number) {
    this.tick(now);
    this.status = "complete";
  }
  nextPassage(passage: string) {
    this.correctBefore = this.snapshot().correct;
    this.input = "";
    this.passage = passage || "Ready to type.";
    this.rewarded.clear();
    this.wordClean = true;
    this.status = "running";
  }
  handleKey(key: string, now: number): boolean {
    this.tick(now);
    if (this.status !== "running") return false;
    if (key === "Backspace") {
      if (!this.input.length) return false;
      this.input = this.input.slice(0, -1);
      this.streak = this.wordCombo = 0;
      this.wordClean = false;
      this.emit("backspace", false);
      return true;
    }
    if (key.length !== 1 || this.input.length >= this.passage.length) return false;
    const index = this.input.length;
    const correct = key === this.passage[index];
    const firstReward = correct && !this.rewarded.has(index);
    this.input += key;
    this.attempts++;
    if (correct) {
      this.correctAttempts++;
      if (firstReward) {
        this.rewarded.add(index);
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
      }
    } else {
      this.streak = this.wordCombo = 0;
      this.wordClean = false;
    }
    if (this.passage[index] === " " || this.input.length === this.passage.length) {
      if (this.wordClean && firstReward) this.wordCombo++;
      this.bestWordCombo = Math.max(this.bestWordCombo, this.wordCombo);
      this.wordClean = true;
    }
    this.emit(correct ? "correct" : "incorrect", firstReward);
    if (this.input.length === this.passage.length) {
      this.status = "complete";
      this.emit("complete", false);
    }
    return true;
  }
  snapshot(): TypingSnapshot {
    const states = [...this.passage].map((character, index) =>
      index >= this.input.length
        ? ("pending" as const)
        : character === this.input[index]
          ? ("correct" as const)
          : ("incorrect" as const),
    );
    const correct = this.correctBefore + states.filter((state) => state === "correct").length;
    return {
      passage: this.passage,
      input: this.input,
      position: this.input.length,
      states,
      progress: (this.input.length / this.passage.length) * 100,
      status: this.status,
      countdown: Math.ceil(this.countdownMs / 1000),
      elapsed: this.elapsed,
      remaining: this.limitMs === null ? null : Math.max(0, this.limitMs - this.elapsed),
      correct,
      incorrect: this.attempts - this.correctAttempts,
      attempts: this.attempts,
      accuracy: calculateAccuracy(this.correctAttempts, this.attempts),
      wpm: calculateWpm(correct, this.elapsed),
      streak: this.streak,
      bestStreak: this.bestStreak,
      wordCombo: this.wordCombo,
      bestWordCombo: this.bestWordCombo,
    };
  }
  private emit(kind: TypingEvent["kind"], rewarded: boolean) {
    const event = { kind, rewarded, snapshot: this.snapshot() };
    this.listeners.forEach((listener) => listener(event));
  }
}
