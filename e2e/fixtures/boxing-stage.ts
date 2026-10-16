import * as Phaser from "phaser";
import { BoxingAnimator } from "@/game/scenes/BoxingAnimator";
import { BoxerRig } from "@/game/scenes/BoxerRig";
import { boxingPresentation } from "@/game/systems/BoxingPresentation";

class BoxingStage extends Phaser.Scene {
  private actors: BoxerRig[] = [];
  private animator?: BoxingAnimator;
  private clock = 0;
  private delta = 16;
  private baseline = 0;
  private plan = boxingPresentation("jab");
  create() {
    this.tweens.getDelta = () => this.delta;
    Object.assign(window, {
      boxLab: {
        play: (move: string, reverse = false, compact = false, reduced = false) => {
          this.animator?.reset();
          this.tweens.killAll();
          this.time.removeAllEvents();
          this.children.removeAll(true);
          this.cameras.main.resetFX();
          this.time.paused = false;
          this.tweens.resumeAll();
          this.scale.setGameSize(compact ? 600 : 960, 410);
          this.cameras.main.centerOn(480, 205);
          this.add
            .graphics()
            .fillStyle(0x111c2b)
            .fillRect(0, 0, 960, 410)
            .fillStyle(0x27384c)
            .fillRect(0, 285, 960, 125)
            .lineStyle(3, 0x7791b3, 0.5)
            .lineBetween(0, 210, 960, 210)
            .lineBetween(0, 330, 960, 330);
          const left = compact ? 375 : 360,
            right = compact ? 585 : 600;
          const source = new BoxerRig(this, reverse ? right : left, 0x84adff, reverse).setDepth(5);
          const target = new BoxerRig(this, reverse ? left : right, 0xff829c, !reverse).setDepth(5);
          this.actors = [source, target];
          this.baseline = this.children.length;
          this.plan = boxingPresentation(move);
          this.animator = new BoxingAnimator(this, reduced);
          this.animator.play(
            {
              serial: 1,
              source: reverse ? "opponent" : "player",
              damage: move === "guard" ? 0 : 42,
              effect: "impact",
              name: move,
              presentation: this.plan,
            },
            source,
            target,
            0x84adff,
          );
          return this.state();
        },
        advance: (ms: number) => {
          while (ms > 0) {
            this.delta = Math.min(16, ms);
            this.clock += this.delta;
            this.game.step(this.clock, this.delta);
            ms -= this.delta;
          }
          return this.state();
        },
        pause: (paused: boolean) => {
          this.time.paused = paused;
          if (paused) this.tweens.pauseAll();
          else this.tweens.resumeAll();
        },
        state: () => this.state(),
      },
    });
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => this.game.loop.stop());
  }
  private state() {
    return {
      impactMs: this.plan.impactMs,
      durationMs: this.plan.durationMs,
      baseline: this.baseline,
      objects: this.children.length,
      tweens: this.tweens.getTweens().length,
      damageLabels: this.children.list.filter((object) => object.name === "boxing-damage").length,
      contacts: this.children.list.filter((object) => object.name === "boxing-contact").length,
      actors: this.actors.map((actor) => ({
        x: actor.x,
        y: actor.y,
        angle: actor.angle,
        scaleX: actor.scaleX,
        pose: { ...actor.pose },
        busy: actor.busy,
      })),
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
  scene: [BoxingStage],
  input: { keyboard: false, mouse: false, touch: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
