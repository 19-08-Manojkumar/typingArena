import * as Phaser from "phaser";

export const boxerRest = {
  leadX: 47,
  leadY: -101,
  rearX: 5,
  rearY: -108,
  leadAngle: 0,
  rearAngle: -12,
  bodyX: 0,
  bodyY: 0,
  twist: 0,
  headX: 0,
  headY: 0,
};
export type BoxerPose = typeof boxerRest;

/** Wrists drive two connected arm segments; feet remain planted as the torso turns. */
export class BoxerRig extends Phaser.GameObjects.Container {
  readonly pose: BoxerPose = { ...boxerRest };
  busy = false;
  private legs: Phaser.GameObjects.Graphics;
  private torso: Phaser.GameObjects.Graphics;
  private head: Phaser.GameObjects.Graphics;
  private arms: Phaser.GameObjects.Graphics[];
  private gloves: Phaser.GameObjects.Container[];
  private skin: number;

  constructor(scene: Phaser.Scene, x: number, color: number, flip: boolean) {
    super(scene, x, 278);
    scene.add.existing(this);
    this.setScale(flip ? -1 : 1, 1);
    this.skin = flip ? 0xbc8773 : 0xe2ae8b;
    const shadow = scene.add.graphics().fillStyle(0x030711, 0.45).fillEllipse(0, 43, 118, 18);
    this.legs = scene.add.graphics().setName("boxer-footwork");
    this.torso = scene.add.graphics().setName("boxer-torso");
    this.torso.fillStyle(this.skin).fillRoundedRect(-27, -86, 54, 66, 15);
    this.torso
      .lineStyle(2, 0x815346, 0.6)
      .lineBetween(-18, -65, 0, -58)
      .lineBetween(0, -58, 19, -66);
    this.torso.lineBetween(0, -54, 0, -31);
    this.torso.fillStyle(color).fillRoundedRect(-30, -24, 61, 34, 5);
    this.torso.fillStyle(0xe9ecdf).fillRect(-30, -24, 61, 7);
    this.torso.fillStyle(0x22334b).fillRect(-3, -16, 8, 24);
    this.torso.fillStyle(this.skin).fillRect(-8, -95, 18, 15);
    this.head = scene.add.graphics().setName("boxer-head");
    this.head.fillStyle(this.skin).fillRoundedRect(-17, -128, 36, 42, 12);
    this.head.fillTriangle(16, -111, 25, -103, 16, -101);
    this.head.fillStyle(0x152034).fillRoundedRect(-20, -135, 39, 17, 6);
    this.head.fillRect(-19, -124, 9, 16);
    this.head.fillStyle(0xf6f0df).fillRect(8, -113, 8, 3);
    this.head.lineStyle(3, 0x403137).lineBetween(6, -117, 17, -116);
    this.head.lineStyle(2, 0x754841).lineBetween(11, -95, 20, -97);
    this.arms = [scene.add.graphics(), scene.add.graphics()];
    this.gloves = ["rear-glove", "lead-glove"].map((name) => {
      const glove = scene.add.container(0, 0).setName(name);
      const art = scene.add.graphics();
      art.fillStyle(0xe8ebea).fillRoundedRect(-12, 4, 24, 15, 3);
      art.lineStyle(1, 0x8b9cac).lineBetween(-10, 10, 10, 10).lineBetween(-10, 14, 10, 14);
      art.fillStyle(0x13213c).fillRoundedRect(-17, -24, 36, 35, 11);
      art.fillStyle(color).fillRoundedRect(-16, -26, 34, 34, 11);
      art.fillStyle(0xffffff, 0.25).fillRoundedRect(-10, -22, 23, 6, 3);
      art.fillStyle(color).fillEllipse(-15, -3, 12, 19);
      art.lineStyle(2, 0x18243b, 0.55).lineBetween(-8, 4, 12, 4);
      return glove.add(art);
    });
    this.add([
      shadow,
      this.legs,
      this.arms[0],
      this.gloves[0],
      this.torso,
      this.head,
      this.arms[1],
      this.gloves[1],
    ]);
    this.setData("homeX", x);
    this.setData("homeY", 278);
    this.renderPose();
  }

  renderPose() {
    const p = this.pose;
    this.torso.setPosition(p.bodyX, p.bodyY).setAngle(p.twist);
    this.head.setPosition(p.bodyX + p.headX, p.bodyY + p.headY).setAngle(p.twist * 0.45);
    const leg = this.legs;
    leg.clear().lineStyle(18, 0x1b2940);
    leg.lineBetween(-14 + p.bodyX, p.bodyY - 2, -26 + p.bodyX * 0.3, 18);
    leg.lineBetween(-26 + p.bodyX * 0.3, 18, -31, 37);
    leg.lineBetween(14 + p.bodyX, p.bodyY - 2, 27 + p.bodyX * 0.3, 18);
    leg.lineBetween(27 + p.bodyX * 0.3, 18, 33, 37);
    leg.lineStyle(3, 0x7892b1, 0.6).lineBetween(-24, 21, -30, 36).lineBetween(29, 21, 33, 36);
    leg.fillStyle(0x202f48).fillRoundedRect(-45, 30, 29, 14, 4).fillRoundedRect(20, 30, 30, 14, 4);
    leg.lineStyle(3, 0xb6c7dc).lineBetween(-42, 42, -17, 42).lineBetween(23, 42, 48, 42);
    this.arms.forEach((arm, i) => {
      const lead = i === 1;
      const sx = (lead ? 20 : -20 + Math.max(0, p.twist) * 3) + p.bodyX;
      const sy = -75 + p.bodyY;
      const wx = (lead ? p.leadX : p.rearX) + p.bodyX;
      const wy = (lead ? p.leadY : p.rearY) + p.bodyY;
      const dx = wx - sx,
        dy = wy - sy;
      const distance = Math.hypot(dx, dy) || 1;
      const bend = Math.sqrt(Math.max(0, 42 * 42 - Math.min(42, distance / 2) ** 2));
      const ex = (sx + wx) / 2 - (dy / distance) * bend;
      const ey = (sy + wy) / 2 + (dx / distance) * bend;
      arm.clear().lineStyle(19, 0x704a43);
      arm.lineBetween(sx, sy, ex, ey).lineBetween(ex, ey, wx, wy);
      arm
        .lineStyle(15, this.skin)
        .lineBetween(sx, sy - 1, ex, ey - 1)
        .lineBetween(ex, ey - 1, wx, wy - 1);
      this.gloves[i].setPosition(wx, wy).setAngle(lead ? p.leadAngle : p.rearAngle);
    });
  }

  resetPose() {
    Object.assign(this.pose, boxerRest);
    this.busy = false;
    this.renderPose();
  }

  idle(time: number) {
    if (this.busy) return;
    Object.assign(this.pose, boxerRest, {
      bodyY: Math.sin(time / 190) * 1.4,
      leadY: -101 + Math.sin(time / 230) * 2,
    });
    this.renderPose();
  }
}
