import * as Phaser from "phaser";
import { AttackAnimator } from "@/game/scenes/AttackAnimator";
import { makeFighter } from "@/game/scenes/FighterArt";
import { characters } from "@/game/data/characters";
import { attackPresentation } from "@/game/systems/AttackPresentation";

/** Isolated real renderer for checking every move without altering combat or adding a debug route. */
class AnimationStage extends Phaser.Scene {
  private actors: Phaser.GameObjects.Container[] = [];
  private clock = 0;
  private stepMs = 16;
  private paused = false;
  private plan = attackPresentation(characters[0].abilities[0], "ninja", 100, 100);

  create() {
    this.cameras.main.centerOn(480, 205);
    this.tweens.getDelta = () => this.stepMs;
    Object.assign(window, {
      attackLab: {
        play: (
          fighter: number,
          slot: number,
          compact = false,
          reverse = false,
          reduced = false,
          quality = 100,
        ) => {
          this.tweens.killAll();
          this.time.removeAllEvents();
          this.children.removeAll(true);
          this.cameras.main.resetFX();
          this.paused = false;
          this.time.paused = false;
          this.tweens.resumeAll();
          this.scale.resize(compact ? 600 : 960, 410);
          this.cameras.main.centerOn(480, 205);
          const bg = this.add.graphics();
          bg.fillStyle(0x15192d).fillRect(0, 0, 960, 410);
          bg.fillStyle(0x25273f).fillEllipse(480, 329, 900, 95);
          bg.lineStyle(1, 0x626788, 0.5).strokeEllipse(480, 322, 780, 80);
          const selected = characters[fighter];
          const color = Phaser.Display.Color.HexStringToColor(selected.color).color;
          const left = compact ? 330 : 255;
          const right = compact ? 630 : 710;
          const source = makeFighter(
            this,
            reverse ? right : left,
            color,
            reverse,
            selected.id,
          ).setDepth(5);
          const target = makeFighter(
            this,
            reverse ? left : right,
            0xe49ba5,
            !reverse,
            "brawler",
          ).setDepth(5);
          this.actors = [source, target];
          this.plan = attackPresentation(selected.abilities[slot], selected.id, quality, quality);
          new AttackAnimator(this, reduced).play(
            {
              serial: 1,
              source: reverse ? "opponent" : "player",
              damage: 42,
              name: selected.abilities[slot].name,
              effect: selected.abilities[slot].effect,
              presentation: this.plan,
            },
            source,
            target,
            color,
          );
          return this.state();
        },
        advance: (ms: number) => {
          while (ms > 0) {
            this.stepMs = Math.min(16, ms);
            this.clock += this.stepMs;
            this.game.step(this.clock, this.stepMs);
            ms -= this.stepMs;
          }
          return this.state();
        },
        pause: (value: boolean) => {
          this.paused = value;
          this.time.paused = value;
          if (value) this.tweens.pauseAll();
          else this.tweens.resumeAll();
        },
        state: () => this.state(),
      },
    });
    // Stop only the automatic loop. Tests advance the real scene and renderer explicitly.
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => this.game.loop.stop());
  }

  private state() {
    return {
      paused: this.paused,
      impactMs: this.plan.impactMs,
      durationMs: this.plan.durationMs,
      objects: this.children.length,
      tweens: this.tweens.getTweens().length,
      damageLabels: this.children.list.filter(
        (child) => child instanceof Phaser.GameObjects.Text && child.text === "−42",
      ).length,
      actors: this.actors.map((actor) => ({
        x: actor.x,
        y: actor.y,
        angle: actor.angle,
        alpha: actor.alpha,
        scaleX: actor.scaleX,
        scaleY: actor.scaleY,
        armAngle: (actor.getByName("lead-arm") as Phaser.GameObjects.Container).angle,
      })),
      summons: this.children.list
        .filter((child) => child.name === "battle-summon" || child.name === "celestial-shade")
        .map((child) => {
          const shade = child as Phaser.GameObjects.Container;
          return { x: shade.x, y: shade.y, scaleX: shade.scaleX, scaleY: shade.scaleY };
        }),
    };
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  width: 960,
  height: 410,
  parent: "stage",
  banner: false,
  audio: { noAudio: true },
  scene: [AnimationStage],
  input: { keyboard: false, mouse: false, touch: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
