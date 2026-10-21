import { makePortraitFighter } from "@/game/scenes/PortraitFighter";
import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";

type Actor = Phaser.GameObjects.Container;
type Art = Phaser.GameObjects.Graphics;

/** A separate choreography keeps the army out of Crescent Barrage's stacked clone slots. */
export class CelestialTempest {
  constructor(private scene: Phaser.Scene) {}

  play(source: Actor, target: Actor, color: number, plan: AttackPresentation) {
    const direction = source.x < target.x ? 1 : -1;
    const gap = Math.abs(target.x - source.x);
    const columns = gap < 380 ? 3 : 4;
    const size = gap < 380 ? 0.62 : 0.72;
    const center = (source.x + target.x) / 2;
    const storm = this.storm(center, color, plan);

    // Two ranks, unique slots and opaque bodies: no repeated positions or flattened silhouettes.
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < 2; row++) {
        const index = column * 2 + row;
        const x = source.x + direction * (100 + (column * (gap - 200)) / (columns - 1));
        const y = row === 0 ? 242 : 354;
        const summonAt = index * 55;
        const launchAt = plan.impactMs - 1450 + index * 115;
        this.after(summonAt, () => {
          const portal = this.art(x, y + 2, 3);
          portal.fillStyle(0x070b20, 0.9).fillEllipse(0, 0, 54, 13);
          portal.lineStyle(2, color, 0.85).strokeEllipse(0, 0, 54, 13);
          portal.lineStyle(1, 0xd8f6ff, 0.65).strokeEllipse(0, 0, 40, 7);
          portal.setAlpha(0);
          this.scene.tweens.add({ targets: portal, alpha: 1, duration: 180 });
          this.fade(portal, launchAt - summonAt + 100, 200);

          const { shade, sword, scarf } = this.shade(x, y + 18, direction, size, color);
          this.scene.tweens.add({
            targets: shade,
            y,
            alpha: 1,
            duration: 270,
            ease: "Sine.easeOut",
          });
          this.scene.tweens.add({
            targets: scarf,
            angle: -12,
            duration: 230,
            yoyo: true,
            repeat: 1,
          });

          this.after(launchAt - summonAt, () => {
            // Alternate high/low passes; each shade dissolves before the next in its lane.
            const hitX = target.x - direction * (row === 0 ? 42 : 28);
            const hitY = row === 0 ? 242 : 314;
            const trail = this.art(x, y - 30, 6);
            trail.lineStyle(8, color, 0.12).lineBetween(-direction * 48, 0, 0, 0);
            trail.lineStyle(2, 0xc8eaff, 0.7).lineBetween(-direction * 38, 0, 0, 0);
            this.scene.tweens.add({
              targets: trail,
              x: hitX,
              y: hitY - 30,
              alpha: 0,
              duration: 270,
              ease: "Cubic.easeIn",
              onComplete: () => trail.destroy(),
            });
            this.scene.tweens.add({ targets: sword, angle: 105, duration: 260 });
            this.scene.tweens.add({
              targets: shade,
              x: hitX,
              y: hitY,
              angle: direction * 16,
              duration: 270,
              ease: "Cubic.easeIn",
              onComplete: () => {
                this.cut(target.x, hitY - 28, color, direction, row);
                this.fade(shade, 0, 110);
                // Each strike feeds the overhead core before its final descent.
                const spark = this.art(target.x, hitY - 28, 8);
                spark.fillStyle(0xe7faff).fillCircle(0, 0, 3);
                spark.lineStyle(2, color, 0.5).strokeCircle(0, 0, 7);
                this.scene.tweens.add({
                  targets: spark,
                  x: center,
                  y: 173,
                  alpha: 0.3,
                  duration: 200,
                  ease: "Sine.easeOut",
                  onComplete: () => spark.destroy(),
                });
              },
            });
          });
        });
      }
    }

    this.after(plan.impactMs - 300, () => {
      this.scene.tweens.add({
        targets: storm,
        x: target.x,
        y: 235,
        scale: 0.65,
        duration: 300,
        ease: "Cubic.easeIn",
      });
    });
    this.after(plan.impactMs, () => {
      storm.destroy();
      this.blast(target.x, 235, color, plan.quality);
    });
  }

  private after(delay: number, callback: () => void) {
    this.scene.time.delayedCall(delay, callback);
  }

  private art(x: number, y: number, depth: number) {
    return this.scene.add.graphics().setPosition(x, y).setDepth(depth);
  }

  private fade(object: Art | Actor, delay: number, duration: number) {
    this.scene.tweens.add({
      targets: object,
      alpha: 0,
      delay,
      duration,
      onComplete: () => object.destroy(),
    });
  }

  private shade(x: number, y: number, direction: number, size: number, color: number) {
    const shade = this.scene.add
      .container(x, y)
      .setName("celestial-shade")
      .setDepth(6)
      .setScale(direction * size, size)
      .setAlpha(0);
    // Retain the summon formation and timing, using the same masked ninja as the card.
    const fighter = makePortraitFighter(this.scene, 0, false, "ninja", true, color)
      .setPosition(0, -21.5)
      .setScale(0.5);
    (fighter.getByName("hero-shadow") as Phaser.GameObjects.Graphics).setVisible(false);
    const scarf = fighter.getByName("hero-cape") as Phaser.GameObjects.Container;
    const sword = fighter.getByName("lead-arm") as Phaser.GameObjects.Container;
    shade.add(fighter);
    return { shade, sword, scarf };
  }

  private cut(x: number, y: number, color: number, direction: number, row: number) {
    const cut = this.art(x, y, 9).setScale(direction, row === 0 ? 1 : -1);
    cut.lineStyle(9, color, 0.3).lineBetween(-32, 20, 30, -22);
    cut.lineStyle(2, 0xedfaff).lineBetween(-32, 20, 30, -22);
    this.fade(cut, 0, 160);
  }

  private storm(x: number, color: number, plan: AttackPresentation) {
    const storm = this.scene.add.container(x, 173).setDepth(7).setScale(0.15).setAlpha(0);
    const halo = this.art(0, 0, 0);
    halo.fillStyle(color, 0.06).fillCircle(0, 0, 51);
    halo.fillStyle(color, 0.12).fillCircle(0, 0, 40);
    const orbit = this.art(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      orbit.lineStyle(3, color, 0.85);
      orbit
        .beginPath()
        .arc(0, 0, 36 + i * 3, angle, angle + 1.4)
        .strokePath();
      orbit.fillStyle(0xd9f8ff).fillCircle(Math.cos(angle) * 39, Math.sin(angle) * 39, 3);
    }
    const core = this.art(0, 0, 0);
    core.fillStyle(color, 0.3).fillCircle(0, 0, 29);
    core.fillStyle(0xbfeaff, 0.9).fillCircle(0, 0, 19);
    core.fillStyle(0xf4fcff).fillCircle(0, 0, 12);
    storm.add([halo, orbit, core]);
    this.scene.tweens.add({ targets: storm, alpha: 1, duration: 350 });
    this.scene.tweens.add({
      targets: storm,
      scale: 0.95 + plan.quality * 0.18,
      duration: plan.impactMs - 360,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: orbit,
      angle: 620,
      duration: plan.impactMs,
      ease: "Quad.easeIn",
    });
    return storm;
  }

  private blast(x: number, y: number, color: number, quality: number) {
    const flash = this.art(x, y, 9).setScale(0.25);
    flash.fillStyle(color, 0.12).fillCircle(0, 0, 110);
    flash.fillStyle(color, 0.26).fillCircle(0, 0, 78);
    flash.fillStyle(0xc5edff, 0.85).fillCircle(0, 0, 42);
    flash.fillStyle(0xffffff).fillCircle(0, 0, 24);
    this.scene.tweens.add({
      targets: flash,
      scale: 1 + quality * 0.15,
      alpha: 0,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
    for (let wave = 0; wave < 3; wave++) {
      this.after(wave * 90, () => {
        const ring = this.art(x, y, 8).setScale(0.2);
        ring.lineStyle(3 - wave * 0.6, wave === 0 ? 0xe6faff : color, 0.85);
        ring.strokeCircle(0, 0, 28);
        this.scene.tweens.add({
          targets: ring,
          scale: 3.3 + wave * 0.65,
          alpha: 0,
          duration: 540,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      });
    }
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const ray = this.art(x, y, 9).setRotation(angle);
      ray.lineStyle(i % 3 === 0 ? 3 : 1.5, i % 2 ? color : 0xd7f8ff, 0.9);
      ray.lineBetween(10, 0, 25 + (i % 3) * 7, 0);
      this.scene.tweens.add({
        targets: ray,
        x: x + Math.cos(angle) * (80 + (i % 3) * 18),
        y: y + Math.sin(angle) * 76,
        alpha: 0,
        duration: 440 + (i % 3) * 70,
        ease: "Cubic.easeOut",
        onComplete: () => ray.destroy(),
      });
    }
  }
}
