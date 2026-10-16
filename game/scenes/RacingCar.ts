import type * as Phaser from "phaser";

/** Side-view car rig: wheels, body, lights and exhaust move independently. */
export class RacingCar {
  readonly root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private wheels: Phaser.GameObjects.Container[] = [];
  private flame: Phaser.GameObjects.Graphics;
  private lights: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    model: string,
    player = false,
  ) {
    this.root = scene.add
      .container(x, y)
      .setDepth(5)
      .setName(player ? "race-player" : "race-rival");
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x02050b, 0.65).fillEllipse(0, 16, 110, 13);
    this.glow = scene.add.graphics();
    this.glow.fillStyle(color, 0.15).fillEllipse(0, 12, 100, 12);
    this.glow.lineStyle(2, color, 0.8).lineBetween(-39, 11, 39, 11);
    this.flame = scene.add
      .graphics()
      .setPosition(-47, -1)
      .setVisible(false)
      .setName("race-exhaust");
    this.flame.fillStyle(color, 0.2).fillTriangle(0, -9, -64, 0, 0, 9);
    this.flame.fillStyle(0x75cbff, 0.8).fillTriangle(0, -5, -44, 0, 0, 5);
    this.flame.fillStyle(0xe2fbff).fillTriangle(0, -2, -25, 0, 0, 2);
    this.root.add([shadow, this.glow, this.flame]);
    this.body = scene.add.container(0, 0).setName("race-chassis");
    const art = scene.add.graphics();
    const muscle = model === "ignition";
    const future = model === "aurora";
    const roof = model === "specter" ? -26 : muscle ? -29 : -31;
    const points = [
      { x: -49, y: 1 },
      { x: -45, y: -12 },
      { x: -26, y: -16 },
      { x: -13, y: roof },
      { x: 13, y: roof + 2 },
      { x: 29, y: -14 },
      { x: 47, y: -10 },
      { x: 52, y: 0 },
      { x: 47, y: 10 },
      { x: -44, y: 10 },
    ];
    art.fillStyle(color).fillPoints(points, true);
    art.lineStyle(1.5, 0xe7f4ff, 0.65).strokePoints(points, true);
    art.fillStyle(0x09182c).fillPoints(
      [
        { x: -23, y: -15 },
        { x: -10, y: roof + 4 },
        { x: 10, y: roof + 5 },
        { x: 23, y: -15 },
      ],
      true,
    );
    art.lineStyle(1, 0x82c9f1, 0.8).lineBetween(-9, roof + 5, 11, roof + 6);
    art.lineStyle(2, color, 0.7).lineBetween(-1, roof + 4, -1, -14);
    art.fillStyle(0xffffff, 0.2).fillPoints(
      [
        { x: -40, y: -11 },
        { x: -24, y: -13 },
        { x: 41, y: -8 },
        { x: 12, y: -6 },
      ],
      true,
    );
    art.fillStyle(0x0a1325).fillRect(-44, 6, 90, 6);
    art.lineStyle(1, 0xeffaff, 0.45).lineBetween(-13, -11, -14, 2);
    art.lineStyle(2, 0x14283e).lineBetween(-10, -9, -4, -9);
    art.fillStyle(0xc8f6ff).fillRoundedRect(42, -9, 10, 4, 2);
    art.fillStyle(0xffffff, 0.12).fillTriangle(50, -8, 79, -2, 50, -3);
    art.fillStyle(0xff6385).fillRect(-48, -8, 8, 4);
    if (muscle) {
      art.fillStyle(0x162136).fillRect(20, -17, 15, 4);
      art.lineStyle(3, 0x182637).lineBetween(-36, -11, -36, -19).lineBetween(-47, -19, -26, -19);
    } else if (model === "specter") {
      art.lineStyle(2, 0xe5dbff, 0.8).lineBetween(-35, 0, 29, 0);
      art.fillStyle(0x172138).fillTriangle(-44, -12, -30, -12, -47, -20);
    } else if (future) {
      art.lineStyle(2, 0xe2fff3, 0.9).lineBetween(-38, -2, 35, -2);
      art.fillStyle(0x153646).fillTriangle(17, -11, 38, -7, 23, -1);
    } else {
      art.fillStyle(0x102441).fillRoundedRect(25, -4, 11, 3, 1);
    }
    this.lights = scene.add.graphics();
    this.lights.fillStyle(0xff546b, 0.3).fillEllipse(-46, -5, 22, 13);
    this.lights.fillStyle(0xffb6ad).fillRect(-49, -8, 8, 4);
    this.body.add([art, this.lights]);
    this.root.add(this.body);
    for (const wx of [-29, 30]) {
      const wheel = scene.add.container(wx, 8).setName("race-wheel");
      const rim = scene.add.graphics();
      rim.fillStyle(0x050810).fillCircle(0, 0, 11);
      rim.lineStyle(2, 0x29384c).strokeCircle(0, 0, 10);
      rim.fillStyle(0x8193aa).fillCircle(0, 0, 6.5);
      rim.fillStyle(0x111d30).fillCircle(0, 0, 4.5);
      rim.lineStyle(1, 0xd4e8f3);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        rim.lineBetween(0, 0, Math.cos(a) * 6, Math.sin(a) * 6);
      }
      wheel.add(rim);
      this.wheels.push(wheel);
      this.root.add(wheel);
    }
    this.root.setScale(player ? 1 : 0.93);
  }

  animate(distance: number, speed: number, boost: boolean, brake: boolean, reduced: boolean) {
    const moving = !reduced && speed > 0.5;
    this.wheels.forEach((wheel) => wheel.setAngle(reduced ? 0 : distance * 15));
    this.body.y = moving ? Math.sin(distance * 2.6) * Math.min(0.9, speed / 50) : 0;
    this.body.angle = moving ? (brake ? 2 : boost ? -1.5 : Math.sin(distance * 0.8) * 0.3) : 0;
    this.flame.setVisible(boost && !reduced);
    this.flame.setScale(0.85 + Math.sin(distance * 3) * 0.16, 0.8 + Math.sin(distance * 5) * 0.12);
    this.glow.setAlpha(boost ? 1 : 0.55);
    this.lights.setAlpha(brake ? 1 : 0.2);
  }
}
