import * as Phaser from "phaser";
import { RacingScene } from "@/game/scenes/RacingScene";
import { RacingSession } from "@/game/systems/RacingSession";
import { vehicles } from "@/game/data/vehicles";

const options = new URLSearchParams(location.search);
const reduced = options.get("reduced") === "true";
const session = new RacingSession(
  vehicles[Number(options.get("vehicle") || 0)],
  Number(options.get("distance") || 2200),
  "easy",
  "long",
);

class RacingStage extends RacingScene {
  private clock = 0;
  private stepMs = 16;
  constructor() {
    super(session, reduced);
  }
  create() {
    super.create();
    this.tweens.getDelta = () => this.stepMs;
    Object.assign(window, {
      raceLab: {
        advance: (ms: number) => this.advance(ms),
        type: (count: number) => {
          for (let i = 0; i < count && !session.race.finished; i++) {
            const snapshot = session.engine.snapshot();
            session.key(snapshot.passage[snapshot.position]);
            this.advance(80);
          }
          return this.state();
        },
        boost: () => session.nitro(),
        mistake: () => {
          const snapshot = session.engine.snapshot();
          session.key(snapshot.passage[snapshot.position] === "x" ? "z" : "x");
          this.advance(16);
          return this.state();
        },
        pause: () => {
          session.pause();
          this.advance(16);
          return this.state();
        },
        resume: () => {
          session.resume();
          this.advance(16);
          return this.state();
        },
        resize: (width: number) => {
          this.scale.setGameSize(width, 410);
          return this.state();
        },
        state: () => this.state(),
      },
    });
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => this.game.loop.stop());
  }
  private advance(ms: number) {
    while (ms > 0) {
      this.stepMs = Math.min(16, ms);
      this.clock += this.stepMs;
      this.game.step(this.clock, this.stepMs);
      ms -= this.stepMs;
    }
    return this.state();
  }
  private state() {
    const cars = this.children.list.filter(
      (child) => child.name === "race-player" || child.name === "race-rival",
    ) as Phaser.GameObjects.Container[];
    return {
      status: session.engine.snapshot().status,
      position: session.race.position,
      speed: session.race.speed,
      nitro: session.race.nitro,
      boost: session.race.boostRemaining,
      finished: session.race.finished,
      place: session.race.place,
      objects: this.children.length,
      tweens: this.tweens.getTweens().length,
      confetti: this.children.list.filter((child) => child.name === "race-confetti").length,
      announcement: (this.children.getByName("race-announcement") as Phaser.GameObjects.Text).text,
      city: this.children.list
        .filter((child) => child.name === "race-city")
        .map((child) => (child as Phaser.GameObjects.Graphics).x),
      cars: cars.map((car) => ({
        x: car.x,
        y: car.y,
        wheels: car.list
          .filter((child) => child.name === "race-wheel")
          .map((child) => (child as Phaser.GameObjects.Container).angle),
        body: {
          y: (car.getByName("race-chassis") as Phaser.GameObjects.Container).y,
          angle: (car.getByName("race-chassis") as Phaser.GameObjects.Container).angle,
        },
        exhaust: (car.getByName("race-exhaust") as Phaser.GameObjects.Graphics).visible,
      })),
    };
  }
}
new Phaser.Game({
  type: Phaser.CANVAS,
  width: options.get("compact") === "true" ? 600 : 960,
  height: 410,
  parent: "stage",
  banner: false,
  audio: { noAudio: true },
  input: { keyboard: false, mouse: false, touch: false },
  scene: [RacingStage],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
