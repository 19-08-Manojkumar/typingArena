import { FightScene } from "@/game/scenes/FightScene";
import type { BoxingSession } from "@/game/systems/BoxingSession";
import * as Phaser from "phaser";
export class CombatScene extends FightScene {
  private ringLabel!: Phaser.GameObjects.Text;
  private defenseBar!: Phaser.GameObjects.Graphics;
  constructor(
    private match: BoxingSession,
    reducedMotion: boolean,
  ) {
    super("CombatScene", match, 0x84adff, 0xff829c, true, reducedMotion);
  }
  override create() {
    super.create();
    const lights = this.add.graphics().setDepth(1);
    lights.fillStyle(0x84adff, 0.08).fillTriangle(150, 0, 70, 310, 470, 310);
    lights.fillStyle(0xff829c, 0.08).fillTriangle(810, 0, 490, 310, 890, 310);
    lights.lineStyle(2, 0x819abe, 0.22).strokeEllipse(480, 290, 430, 70);
    lights.lineStyle(1, 0x819abe, 0.18).strokeEllipse(480, 290, 390, 56);
    this.add
      .text(480, 282, "T Y P I N G   /   F I G H T   C L U B", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#65768e",
      })
      .setOrigin(0.5)
      .setDepth(1);
    const ropes = this.add.graphics().setDepth(8);
    ropes.lineStyle(3, 0x9c6980, 0.5).lineBetween(73, 333, 900, 333);
    ropes.lineStyle(2, 0x8badcf, 0.35).lineBetween(73, 350, 900, 350);
    this.ringLabel = this.add
      .text(480, 351, "ROUND 1 • TOUCH GLOVES", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f9d9a0",
        backgroundColor: "#161c2c",
        padding: { x: 16, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.defenseBar = this.add.graphics().setDepth(12);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this.player,
        y: 274,
        duration: 430,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.enemy,
        y: 274,
        duration: 510,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({ targets: lights, alpha: 0.45, duration: 2200, yoyo: true, repeat: -1 });
    }
  }
  override update(time: number, delta: number) {
    super.update(time, delta);
    const b = this.match.boxing;
    this.ringLabel.setText(
      b.finished
        ? b.won
          ? "WINNER • YOUR CORNER"
          : `${b.opponent.name.toUpperCase()} WINS`
        : b.intermission > 0
          ? `CORNER BREAK • ROUND ${b.round} IN ${Math.ceil(b.intermission)}`
          : b.defending
            ? "HANDS UP • DEFEND THE COMBINATION"
            : b.counterReady
              ? "OPEN GUARD • COUNTER READY"
              : b.momentum >= 3
                ? "POWER UPPERCUT READY"
                : `ROUND ${b.round} • ${b.nextMove.toUpperCase()} COMBINATION`,
    );
    this.defenseBar.clear();
    if (b.defending && !b.finished) {
      const maximum = b.defenseWindow;
      this.defenseBar.fillStyle(0x292235).fillRoundedRect(380, 397, 200, 5, 2);
      this.defenseBar
        .fillStyle(0xff829c)
        .fillRoundedRect(380, 397, 200 * Math.max(0, b.defenseRemaining / maximum), 5, 2);
    }
  }
  view() {
    const b = this.match.boxing;
    return {
      effect: b.effect,
      playerHealth: b.health,
      enemyHealth: b.enemyHealth,
      finished: b.finished,
      won: b.won,
      warning: b.defending,
    };
  }
}
