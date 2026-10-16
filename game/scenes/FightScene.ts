import * as Phaser from "phaser";
import type { GameSession } from "@/game/systems/GameSession";
import type { CombatEffect } from "@/game/systems/CombatSystem";
import { makeFighter } from "@/game/scenes/FighterArt";
import { AttackAnimator } from "@/game/scenes/AttackAnimator";

export interface FightView {
  effect: CombatEffect;
  playerHealth: number;
  enemyHealth: number;
  finished: boolean;
  won: boolean;
  warning: boolean;
}
export abstract class FightScene extends Phaser.Scene {
  protected player!: Phaser.GameObjects.Container;
  protected enemy!: Phaser.GameObjects.Container;
  private animator!: AttackAnimator;
  private serial = 0;
  private defeated = false;
  private warning!: Phaser.GameObjects.Text;
  constructor(
    key: string,
    protected session: GameSession,
    private playerColor: number,
    private enemyColor: number,
    private boxing: boolean,
    protected reducedMotion: boolean,
    private playerKind = boxing ? "boxer" : "ninja",
    private enemyKind = boxing ? "boxer" : "ninja",
  ) {
    super(key);
  }
  abstract view(): FightView;
  create() {
    this.cameras.main.setBackgroundColor(this.boxing ? 0x1c1829 : 0x15192d);
    const background = this.add.graphics();
    if (this.boxing) {
      for (let i = 0; i < 55; i++) {
        background.fillStyle(i % 3 ? 0x3b334b : 0x54405a, 0.7);
        background.fillCircle(i * 19, 128 + (i % 4) * 21, 8);
      }
      background.fillStyle(0x283048);
      background.fillPoints(
        [
          { x: 70, y: 230 },
          { x: 250, y: 174 },
          { x: 735, y: 174 },
          { x: 905, y: 320 },
          { x: 60, y: 350 },
        ],
        true,
      );
      for (let y = 170; y < 250; y += 28) {
        background.lineStyle(3, y === 198 ? 0x8aadd7 : 0xb76884);
        background.lineBetween(75, y, 900, y);
      }
      background.lineStyle(9, 0x596c8b);
      background.lineBetween(73, 145, 73, 340);
      background.lineBetween(900, 145, 900, 340);
    } else {
      background.fillStyle(0x6c67a3, 0.11);
      background.fillCircle(480, 164, 112);
      background.lineStyle(1, 0xaaa2dd, 0.18);
      background.strokeCircle(480, 164, 123);
      for (let i = 0; i < 12; i++) {
        background.fillStyle(0x242a41);
        background.fillRect(i * 95 - 10, 192 - (i % 3) * 23, 65, 130);
      }
      background.fillStyle(0x26263d);
      background.fillEllipse(480, 328, 910, 125);
      background.lineStyle(2, 0x626788, 0.45);
      background.strokeEllipse(480, 320, 800, 110);
      for (let i = 0; i < 24; i++) {
        background.fillStyle(0xc5baee, 0.35);
        background.fillCircle((i * 149) % 960, 110 + ((i * 47) % 130), i % 3 === 0 ? 2 : 1);
      }
    }
    this.player = makeFighter(this, 255, this.playerColor, false, this.playerKind).setDepth(5);
    this.enemy = makeFighter(this, 710, this.enemyColor, true, this.enemyKind).setDepth(5);
    this.animator = new AttackAnimator(this, this.reducedMotion);
    const resize = () => {
      if (this.boxing) this.animator.resetBoxing();
      this.cameras.main.centerOn(480, 205);
      const compact = this.scale.gameSize.width < 800;
      this.player.x = this.boxing ? (compact ? 375 : 360) : compact ? 330 : 255;
      this.enemy.x = this.boxing ? (compact ? 585 : 600) : compact ? 630 : 710;
      if (this.boxing) {
        this.player.setData("homeX", this.player.x);
        this.enemy.setData("homeX", this.enemy.x);
      }
    };
    resize();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, resize),
    );
    this.warning = this.add
      .text(480, 377, "", { fontFamily: "monospace", fontSize: "13px", color: "#ffadbd" })
      .setOrigin(0.5)
      .setDepth(12);
  }
  update(_time: number, delta: number) {
    this.session.step(delta);
    const state = this.view();
    const status = this.session.engine.snapshot().status;
    const paused = status === "paused" || status === "countdown";
    this.time.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
    this.warning.setText(
      state.warning && !state.finished
        ? this.boxing
          ? "INCOMING COMBO — TYPE THE DEFENSE"
          : "COUNTERATTACK INCOMING"
        : "",
    );
    if (state.effect.serial !== this.serial) {
      this.serial = state.effect.serial;
      const playerAttack = state.effect.source === "player";
      this.animator.play(
        state.effect,
        playerAttack ? this.player : this.enemy,
        playerAttack ? this.enemy : this.player,
        playerAttack ? this.playerColor : this.enemyColor,
      );
    }
    if (state.finished && !this.defeated) {
      this.defeated = true;
      this.time.delayedCall(
        this.boxing ? (state.effect.presentation?.durationMs ?? 720) : 300,
        () =>
          this.tweens.add({
            targets: state.won ? this.enemy : this.player,
            angle: state.won ? 75 : -75,
            alpha: 0.35,
            duration: this.reducedMotion ? 0 : 450,
          }),
      );
    }
  }
}
