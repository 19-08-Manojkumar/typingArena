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
  opponents = [
    { name: "GHOST", position: 0, speed: 0, color: 0xba92ff },
    { name: "BLAZE", position: 0, speed: 0, color: 0xff7f91 },
    { name: "ECHO", position: 0, speed: 0, color: 0x67d5bc },
  ];
  constructor(
    readonly vehicle: Vehicle,
    readonly distance: number,
    readonly difficulty: Difficulty,
  ) {}
  correct(stats: Pick<TypingStats, "accuracy" | "streak">) {
    if (this.finished) return;
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
    this.speed *= 1 - 0.17 / this.vehicle.handling;
    this.nitro = Math.max(0, this.nitro - 4);
  }
  activateNitro(): boolean {
    if (this.finished || this.nitro < 100 || this.boostRemaining > 0 || this.speed < 1)
      return false;
    this.nitro = 0;
    this.boostRemaining = 4 * this.vehicle.nitro;
    this.speed = clamp(this.speed * 1.5, 0, 90);
    return true;
  }
  update(dt: number) {
    if (this.finished) return;
    this.elapsed += dt;
    this.boostRemaining = Math.max(0, this.boostRemaining - dt);
    this.speed *= Math.exp(-(this.boostRemaining > 0 ? 0.65 : 0.95) * dt);
    if (this.speed < 0.1) this.speed = 0;
    this.position = Math.min(this.distance, this.position + this.speed * dt);
    this.opponents.forEach((opponent, index) => {
      opponent.speed =
        aiPace(this.difficulty) *
        0.57 *
        (0.94 + index * 0.055 + Math.sin(this.elapsed * 0.7 + index * 2) * 0.045);
      opponent.position = Math.min(this.distance, opponent.position + opponent.speed * dt);
    });
    this.place =
      1 +
      this.opponents.filter(
        (opponent) => opponent.position >= this.position && opponent.position > 0,
      ).length;
    if (
      this.position >= this.distance ||
      this.opponents.every((opponent) => opponent.position >= this.distance) ||
      this.elapsed >= 240
    )
      this.finished = true;
  }
}
