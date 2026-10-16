import * as Phaser from "phaser";
import type { RacingSession } from "@/game/systems/RacingSession";
import { raceCamera, raceFeedback } from "@/game/systems/RacingPresentation";
import { RacingCar } from "@/game/scenes/RacingCar";

export class RacingScene extends Phaser.Scene {
  private cars: RacingCar[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private city: Phaser.GameObjects.Graphics[] = [];
  private road!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private miniMap!: Phaser.GameObjects.Graphics;
  private finishLine!: Phaser.GameObjects.Graphics;
  private headline!: Phaser.GameObjects.Text;
  private feedback!: Phaser.GameObjects.Text;
  private distanceLabel!: Phaser.GameObjects.Text;
  private eventLabel!: Phaser.GameObjects.Text;
  private visualDistance = 0;
  private previousPlace = 1;
  private previousBoost = false;
  private previousMistakes = 0;
  private eventLife = 0;
  private finishAge = 0;
  private celebrated = false;

  constructor(
    private session: RacingSession,
    private reducedMotion: boolean,
  ) {
    super("RacingScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0c1428);
    this.cars = [];
    this.labels = [];
    this.city = [];
    this.visualDistance = this.session.race.position;
    this.previousPlace = this.session.race.place;
    this.previousBoost = false;
    this.previousMistakes = this.session.race.mistakes;
    this.eventLife = this.finishAge = 0;
    this.celebrated = false;
    for (let layer = 0; layer < 2; layer++) {
      const skyline = this.add.graphics().setDepth(0).setName("race-city");
      this.city.push(skyline);
    }
    this.road = this.add.graphics().setDepth(1);
    this.finishLine = this.add.graphics().setDepth(2).setName("race-finish-line");
    this.effects = this.add.graphics().setDepth(4);
    this.miniMap = this.add.graphics().setDepth(8);
    const textStyle = {
      fontFamily: "Arial",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#c5d6ed",
    };
    this.headline = this.add.text(24, 17, "NEON CIRCUIT / MIDNIGHT RUN", textStyle).setDepth(10);
    this.distanceLabel = this.add
      .text(936, 18, "", { ...textStyle, color: "#9cb0cd" })
      .setOrigin(1, 0)
      .setDepth(10);
    this.feedback = this.add
      .text(24, 40, "", { ...textStyle, fontSize: "11px", color: "#70dbcb" })
      .setDepth(10);
    this.eventLabel = this.add
      .text(480, 68, "", { ...textStyle, fontSize: "19px", stroke: "#0a1427", strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(11)
      .setName("race-announcement");
    const race = this.session.race;
    const playerColor = Phaser.Display.Color.HexStringToColor(race.vehicle.color).color;
    const colors = [playerColor, ...race.opponents.map((rival) => rival.color)];
    const models = [race.vehicle.id, "specter", "ignition", "aurora"];
    colors.forEach((color, i) => {
      this.cars.push(new RacingCar(this, 180, 151 + i * 62, color, models[i], i === 0));
      this.labels.push(
        this.add
          .text(180, 111 + i * 62, i === 0 ? "YOU" : race.opponents[i - 1].name, {
            ...textStyle,
            fontSize: "12px",
            color: i === 0 ? "#e4f4ff" : "#a4b7d3",
            backgroundColor: "#111c2ccc",
            padding: { x: 6, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(7),
      );
    });
    const resize = () => {
      this.cameras.main.setScroll(0, 0);
      const width = this.scale.gameSize.width;
      this.drawCity(width);
      this.distanceLabel.setX(width - 24);
      this.eventLabel.setX(width / 2);
      this.headline.setText(width < 800 ? "NEON CIRCUIT" : "NEON CIRCUIT / MIDNIGHT RUN");
      this.renderRace(0, false);
    };
    resize();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, resize),
    );
    this.renderRace(0, false);
  }

  private drawCity(width: number) {
    this.city.forEach((skyline, layer) => {
      skyline.clear();
      // Keep an extra tile behind the scrolling edge, including on very wide monitors.
      for (let x = 0, i = 0; x < width + 1100; x += 43, i++) {
        const height = 20 + ((i * 37 + layer * 17) % (layer ? 44 : 62));
        skyline.fillStyle(layer ? 0x182b43 : 0x111f36).fillRect(x, 108 - height, 30, height);
        skyline.fillStyle(layer ? 0x4781a5 : 0x36556f, 0.38);
        for (let j = 0; j < 4; j++) skyline.fillRect(x + 7, 114 - height + j * 12, 3, 4);
        if (i % 5 === 0 && layer) {
          skyline.lineStyle(2, i % 2 ? 0xa78bfa : 0x58c9ff, 0.6);
          skyline.lineBetween(x + 2, 108 - height, x + 28, 108 - height);
        }
      }
    });
  }

  update(_time: number, delta: number) {
    this.session.step(delta);
    const status = this.session.engine.snapshot().status;
    const paused = status === "paused" || status === "countdown";
    this.time.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
    if (paused) return;
    const dt = Math.min(delta, 100) / 1000;
    const race = this.session.race;
    this.eventLife = Math.max(0, this.eventLife - dt);
    if (race.finished) {
      this.finishAge += dt;
      if (!this.celebrated) this.celebrate();
    }
    if (!race.finished) {
      if (race.boostRemaining > 0 && !this.previousBoost) this.announce("NITRO ENGAGED", "#8cdeff");
      if (race.mistakes > this.previousMistakes)
        this.announce("EASE BACK INTO YOUR RHYTHM", "#ffb5ae");
      if (race.place < this.previousPlace && race.position > 5)
        this.announce(race.place === 1 ? "TAKING THE LEAD" : "CLEAN OVERTAKE", "#8de8cd");
    }
    this.previousBoost = race.boostRemaining > 0;
    this.previousMistakes = race.mistakes;
    this.previousPlace = race.place;
    const desired =
      race.position +
      (race.finished && !this.reducedMotion ? Math.min(35, this.finishAge * 35) : 0);
    this.visualDistance = this.reducedMotion
      ? race.position
      : Phaser.Math.Linear(this.visualDistance, desired, 1 - Math.exp(-delta / 90));
    this.renderRace(dt, true);
  }

  private renderRace(dt: number, animate: boolean) {
    const race = this.session.race;
    const width = this.scale.gameSize.width;
    const camera = raceCamera(width, race.position, race.distance);
    const boosted = race.boostRemaining > 0 && !race.finished;
    const phase = this.reducedMotion ? 0 : this.visualDistance;
    this.city.forEach((layer, i) => {
      layer.x = -(phase * (i ? 0.48 : 0.16)) % 1000;
    });
    this.drawRoad(width, phase);
    this.drawFinish(
      camera.finishX - (this.visualDistance - race.position) * camera.pixelsPerMeter,
      width,
    );
    const positions = [race.position, ...race.opponents.map((rival) => rival.position)];
    this.cars.forEach((car, i) => {
      const target = i === 0 ? camera.anchor : camera.carX(positions[i]);
      car.root.x =
        !animate || this.reducedMotion
          ? target
          : Phaser.Math.Linear(car.root.x, target, 1 - Math.exp(-dt * 12));
      const gap = i === 0 ? 0 : positions[i] - race.position;
      car.root.alpha = i > 0 && Math.abs(gap) * camera.pixelsPerMeter > width * 0.65 ? 0.55 : 1;
      const speed = i === 0 ? race.speed : race.opponents[i - 1].speed;
      car.animate(
        i === 0 ? this.visualDistance : positions[i],
        speed,
        i === 0 && boosted,
        i === 0 && race.elapsed - race.lastMistakeAt < 0.45,
        this.reducedMotion,
      );
      this.labels[i]
        .setX(car.root.x)
        .setText(
          i === 0
            ? `YOU · ${race.vehicle.name.toUpperCase()}`
            : `${race.opponents[i - 1].name}  ${gap >= 0 ? "+" : "−"}${Math.round(Math.abs(gap))}m`,
        );
    });
    this.drawMotion(width, phase, boosted);
    this.drawMiniMap(width);
    const feedback = raceFeedback(race, this.session.engine.snapshot().status);
    this.feedback
      .setText(feedback.label)
      .setColor(feedback.tone === "error" ? "#f5b3aa" : "#7adcd1");
    this.distanceLabel.setText(
      `${Math.max(0, Math.ceil(race.distance - race.position))} m TO FINISH`,
    );
    if (this.eventLife <= 0) this.eventLabel.setText("");
    this.eventLabel.setAlpha(Math.min(1, this.eventLife / 0.25));
    this.eventLabel.y = this.reducedMotion ? 68 : 68 + Math.max(0, 0.2 - this.eventLife) * 15;
  }

  private drawRoad(width: number, distance: number) {
    const g = this.road;
    g.clear().fillStyle(0x101d31).fillRect(0, 116, width, 247);
    g.fillStyle(0x183049, 0.65).fillRect(0, 117, width, 61);
    for (let lane = 0; lane < 4; lane++) {
      g.fillStyle(lane % 2 ? 0x132136 : 0x14243a, 0.75).fillRect(0, 118 + lane * 62, width, 61);
      if (lane > 0)
        for (let x = -80; x < width + 80; x += 80) {
          g.fillStyle(0x6b85a0, 0.4).fillRect(x - ((distance * 3.2) % 80), 117 + lane * 62, 34, 2);
        }
    }
    g.lineStyle(2, 0x5aa9cc, 0.7).lineBetween(0, 115, width, 115).lineBetween(0, 365, width, 365);
    for (let x = -50; x < width + 50; x += 50) {
      const screenX = x - ((distance * 3.2) % 50);
      g.fillStyle(0x2e4d68).fillRect(screenX, 105, 27, 5).fillRect(screenX, 370, 27, 5);
      g.fillStyle(0x77d8e5, 0.7).fillRect(screenX, 105, 5, 3).fillRect(screenX, 370, 5, 3);
    }
  }

  private drawFinish(x: number, width: number) {
    const g = this.finishLine;
    g.clear().setVisible(x >= -30 && x <= width + 30);
    if (!g.visible) return;
    for (let row = 0; row < 21; row++)
      for (let col = 0; col < 2; col++) {
        g.fillStyle((row + col) % 2 ? 0xe2f5ff : 0x12243b, 0.9);
        g.fillRect(x + col * 10 - 10, 116 + row * 12, 10, 12);
      }
    g.lineStyle(2, 0xc4f4ff, 0.5).lineBetween(x - 14, 116, x - 14, 365);
  }

  private drawMotion(width: number, distance: number, boost: boolean) {
    const g = this.effects;
    g.clear();
    if (this.reducedMotion) return;
    const race = this.session.race;
    const speed = Math.min(1, race.speed / 90);
    if (speed > 0.25)
      for (let i = 0; i < (boost ? 18 : 9); i++) {
        const x =
          ((((i * 137 - distance * (boost ? 12 : 7)) % (width + 150)) + width + 150) %
            (width + 150)) -
          75;
        const y = 129 + ((i * 47) % 224);
        g.lineStyle(boost ? 2 : 1, boost ? 0x86dfff : 0x5b91b9, speed * (boost ? 0.4 : 0.2));
        g.lineBetween(x, y, x + 16 + speed * (boost ? 62 : 32), y);
      }
    if (boost) {
      const x = this.cars[0].root.x;
      g.lineStyle(2, 0x7bdfff, 0.3).strokeEllipse(x - 2, 151, 139, 56);
      g.lineStyle(1, 0xa7eaff, 0.15).strokeEllipse(x - 2, 151, 153, 66);
    }
    const age = race.elapsed - race.lastMistakeAt;
    if (age >= 0 && age < 0.6) {
      for (let i = 0; i < 4; i++) {
        g.fillStyle(0x9aa9be, (1 - age / 0.6) * 0.23);
        g.fillCircle(
          this.cars[0].root.x - 36 - age * 65 - i * 6,
          157 - i * 5 - age * 20,
          5 + i * 2 + age * 8,
        );
      }
    }
  }

  private drawMiniMap(width: number) {
    const race = this.session.race;
    const g = this.miniMap;
    g.clear()
      .fillStyle(0x26394f)
      .fillRoundedRect(24, 391, width - 48, 3, 1);
    g.fillStyle(0x82c8ff).fillRoundedRect(
      24,
      391,
      Math.max(2, ((width - 48) * race.position) / race.distance),
      3,
      1,
    );
    const positions = [race.position, ...race.opponents.map((rival) => rival.position)];
    const colors = [0xd6f3ff, ...race.opponents.map((rival) => rival.color)];
    positions.forEach((position, i) => {
      const x = 24 + ((width - 48) * position) / race.distance;
      g.fillStyle(colors[i]).fillCircle(x, 386 - i * 3, i === 0 ? 3.5 : 2.5);
    });
  }

  private announce(message: string, color: string) {
    this.eventLabel.setText(message).setColor(color);
    this.eventLife = 1.25;
  }

  private celebrate() {
    this.celebrated = true;
    const won = this.session.race.place === 1;
    this.announce(
      won ? "FINISH · FIRST PLACE" : `FINISH · ${this.session.race.place} / 4`,
      won ? "#9cf0d1" : "#d2dff5",
    );
    if (this.reducedMotion || !won) return;
    const width = this.scale.gameSize.width;
    for (let i = 0; i < 24; i++) {
      const piece = this.add
        .graphics()
        .setPosition(width * 0.35 + i * 11, 68)
        .setDepth(12)
        .setName("race-confetti");
      piece.fillStyle([0x8fdfef, 0x9e8fff, 0x8af2cb, 0xeaf7ff][i % 4]).fillRect(-2, -3, 4, 7);
      this.tweens.add({
        targets: piece,
        x: piece.x + ((i % 5) - 2) * 35,
        y: 225 + (i % 4) * 25,
        angle: i * 71,
        alpha: 0,
        duration: 850,
        ease: "Quad.easeOut",
        onComplete: () => piece.destroy(),
      });
    }
  }
}
