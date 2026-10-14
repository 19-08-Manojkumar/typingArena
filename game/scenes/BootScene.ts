import * as Phaser from "phaser";
export class BootScene extends Phaser.Scene {
  constructor(private target: string) {
    super("BootScene");
  }
  create() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillRoundedRect(4, 3, 56, 28, 7);
    graphics.fillStyle(0x142034);
    graphics.fillRoundedRect(19, 7, 19, 20, 4);
    graphics.fillStyle(0x080e1b);
    graphics.fillRect(12, 0, 11, 4);
    graphics.fillRect(12, 30, 11, 4);
    graphics.fillRect(43, 0, 11, 4);
    graphics.fillRect(43, 30, 11, 4);
    graphics.fillStyle(0xe2f5ff);
    graphics.fillRect(56, 6, 6, 5);
    graphics.fillRect(56, 23, 6, 5);
    graphics.generateTexture("arena-car", 64, 34);
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("arena-spark", 8, 8);
    graphics.destroy();
    this.scene.start(this.target);
  }
}
