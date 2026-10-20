import { GameSession } from "@/game/systems/GameSession";
import { RacingSystem } from "@/game/systems/RacingSystem";
import { getPassage } from "@/game/data/passages";
import type { Difficulty, PassageLength, Vehicle } from "@/game/types/game.types";
export class RacingSession extends GameSession {
  readonly race: RacingSystem;
  constructor(
    vehicle: Vehicle,
    distance: number,
    private difficulty: Difficulty,
    private length: PassageLength,
  ) {
    super("racing", getPassage(difficulty, length));
    this.race = new RacingSystem(vehicle, distance, difficulty);
    this.cleanup = this.engine.subscribe((event) => {
      if (event.kind === "correct" && event.rewarded) this.race.correct(event.snapshot);
      if (event.kind === "incorrect") this.race.mistake();
      if (event.kind === "complete")
        this.engine.nextPassage(getPassage(this.difficulty, this.length));
    });
  }
  nitro() {
    if (this.engine.snapshot().status === "running" && this.race.activateNitro()) {
      this.publish();
      return true;
    }
    return false;
  }
  simulate(seconds: number) {
    this.race.update(seconds);
    if (this.race.finished) this.finish(this.race.place === 1, { position: this.race.place });
  }
}
