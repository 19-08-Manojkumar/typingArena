import { acceleration, aiPace, clamp } from "@/lib/scoring";
import type { Difficulty, TypingStats, Vehicle } from "@/game/types/game.types";

export class RacingSystem {
  position = 0;
  speed = 0;
  nitro = 0;
  boostRemaining = 0;
  elapsed = 0;
  finished = false;
  place = 1;
  finishTime: number | null = null;
  mistakes = 0;
  lastMistakeAt = -Infinity;
  lastInputAt = -Infinity;
  opponents = [
    { name: "GHOST", position: 0, speed: 0, color: 0xba92ff, finishTime: null as number | null },
    { name: "BLAZE", position: 0, speed: 0, color: 0xff7f91, finishTime: null as number | null },
    { name: "ECHO", position: 0, speed: 0, color: 0x67d5bc, finishTime: null as number | null },
  ];
  constructor(
    readonly vehicle: Vehicle,
    readonly distance: number,
    readonly difficulty: Difficulty,
  ) {}
  get boostDuration() {
    return 4 * this.vehicle.nitro;
  }
  get canActivateNitro() {
    return !this.finished && this.nitro >= 100 && this.boostRemaining <= 0 && this.speed >= 1;
  }
  correct(stats: Pick<TypingStats, "accuracy" | "streak">) {
    if (this.finished) return;
    this.lastInputAt = this.elapsed;
    this.speed = clamp(
      this.speed +
        acceleration(stats.accuracy, stats.streak, this.vehicle.acceleration) *
          (this.boostRemaining > 0 ? 1.65 : 1),
      0,
      90,
    );
    this.nitro = clamp(this.nitro + (stats.streak >= 5 ? 2.7 : 1.2), 0, 100);
  }
  mistake() {
    if (this.finished) return;
    this.mistakes++;
    this.lastMistakeAt = this.elapsed;
    this.speed *= 1 - 0.17 / this.vehicle.handling;
    this.nitro = Math.max(0, this.nitro - 4);
  }
  activateNitro(): boolean {
    if (!this.canActivateNitro) return false;
    this.nitro = 0;
    this.boostRemaining = this.boostDuration;
    this.speed = clamp(this.speed * 1.5, 0, 90);
    return true;
  }
  update(dt: number) {
    if (this.finished || !Number.isFinite(dt) || dt <= 0) return;
    const start = this.elapsed;
    this.elapsed += dt;
    this.boostRemaining = Math.max(0, this.boostRemaining - dt);
    this.speed *= Math.exp(-(this.boostRemaining > 0 ? 0.65 : 0.95) * dt);
    if (this.speed < 0.1) this.speed = 0;
    const travel = this.speed * dt;
    if (this.finishTime === null && this.position + travel >= this.distance && travel > 0)
      this.finishTime = start + ((this.distance - this.position) / travel) * dt;
    this.position = Math.min(this.distance, this.position + travel);
    this.opponents.forEach((opponent, index) => {
      if (opponent.finishTime !== null) return;
      opponent.speed =
        aiPace(this.difficulty) *
        0.57 *
        (0.94 + index * 0.055 + Math.sin(this.elapsed * 0.7 + index * 2) * 0.045);
      const travel = opponent.speed * dt;
      if (opponent.position + travel >= this.distance)
        opponent.finishTime = start + ((this.distance - opponent.position) / travel) * dt;
      opponent.position = Math.min(this.distance, opponent.position + travel);
    });
    this.place =
      1 +
      this.opponents.filter((opponent) =>
        this.finishTime !== null
          ? opponent.finishTime !== null && opponent.finishTime < this.finishTime
          : opponent.position > this.position,
      ).length;
    if (
      this.position >= this.distance ||
      this.opponents.every((opponent) => opponent.position >= this.distance) ||
      this.elapsed >= 240
    )
      this.finished = true;
  }
}
