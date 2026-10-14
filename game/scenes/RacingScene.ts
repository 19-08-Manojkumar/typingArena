import * as Phaser from "phaser";
import type { RacingSession } from "@/game/systems/RacingSession";
import { assets } from "@/game/data/assets";
export class RacingScene extends Phaser.Scene {
  private cars: Phaser.GameObjects.Image[] = [];
  private road!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private progress!: Phaser.GameObjects.Graphics;
  constructor(
    private session: RacingSession,
    private reducedMotion: boolean,
  ) {
    super("RacingScene");
  }
  create() {
    this.cameras.main.setBackgroundColor(assets.backgrounds.racing);
    const skyline = this.add.graphics();
    for (let i = 0; i < 32; i++) {
      const height = 14 + ((i * 37) % 57);
      skyline.fillStyle(i % 2 ? 0x203149 : 0x19273b);
      skyline.fillRect(i * 31, 87 - height, 24, height);
      skyline.fillStyle(0x507497, 0.3);
      for (let j = 0; j < 4; j++) skyline.fillRect(i * 31 + 6, 84 - height + j * 12, 3, 4);
    }
    this.add.text(28, 18, "NEON CIRCUIT / MIDNIGHT RUN", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#95b9d5",
    });
    this.road = this.add.graphics();
    this.progress = this.add.graphics();
    [
      Phaser.Display.Color.HexStringToColor(this.session.race.vehicle.color).color,
      ...this.session.race.opponents.map((o) => o.color),
    ].forEach((color, index) => {
      this.cars.push(
        this.add
          .image(105, 126 + index * 65, "arena-car")
          .setTint(color)
          .setScale(index === 0 ? 1.12 : 1),
      );
      this.labels.push(
        this.add
          .text(
            105,
            102 + index * 65,
            index === 0 ? "YOU" : this.session.race.opponents[index - 1].name,
            {
              fontFamily: "monospace",
              fontSize: "10px",
              color: index === 0 ? "#d4e8ff" : "#8ea5c2",
            },
          )
          .setOrigin(0.5),
      );
    });
  }
  update(_time: number, delta: number) {
    this.session.step(delta);
    const race = this.session.race;
    const road = this.road;
    road.clear();
    road.fillStyle(0x172335);
    road.fillRect(0, 91, 960, 270);
    road.lineStyle(2, 0x456982);
    road.strokeRect(-2, 91, 964, 270);
    const scroll = this.reducedMotion ? 0 : (race.position * 2) % 72;
    for (let lane = 1; lane < 4; lane++)
      for (let x = -72; x < 960; x += 72) {
        road.fillStyle(0x3e5269, 0.7);
        road.fillRect(x - scroll, 94 + lane * 65, 30, 2);
      }
    for (let y = 94; y < 350; y += 15)
      for (let x = 0; x < 2; x++) {
        road.fillStyle((Math.floor(y / 15) + x) % 2 ? 0x8ca7ba : 0x172335);
        road.fillRect(903 + x * 10, y, 10, 15);
      }
    const positions = [race.position, ...race.opponents.map((o) => o.position)];
    this.cars.forEach((car, index) => {
      const target = 75 + (positions[index] / race.distance) * 815;
      car.x = Phaser.Math.Linear(car.x, target, Math.min(1, delta / 80));
      this.labels[index].x = car.x;
      if (!this.reducedMotion && index === 0 && race.boostRemaining > 0) {
        road.fillStyle(0x7cb6ff, 0.7);
        road.fillTriangle(
          car.x - 35,
          car.y - 7,
          car.x - 70 - Math.sin(_time / 50) * 12,
          car.y,
          car.x - 35,
          car.y + 7,
        );
      }
    });
    this.progress.clear();
    this.progress.fillStyle(0x1e2e42);
    this.progress.fillRoundedRect(28, 383, 904, 4, 2);
    this.progress.fillStyle(0x86b4ff);
    this.progress.fillRoundedRect(
      28,
      383,
      Math.max(2, (904 * race.position) / race.distance),
      4,
      2,
    );
  }
}
