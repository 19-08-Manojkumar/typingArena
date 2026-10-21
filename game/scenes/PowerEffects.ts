import type * as Phaser from "phaser";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";
import { AttackVfx } from "@/game/scenes/AttackVfx";
import { makeFighter } from "@/game/scenes/FighterArt";
import { fighterMotion } from "@/game/scenes/FighterMotion";
import { CelestialTempest } from "@/game/scenes/CelestialTempest";
import { isHeroId } from "@/game/data/heroStyles";
import { HeroPowerEffects } from "@/game/scenes/HeroPowerEffects";

type Actor = Phaser.GameObjects.Container;

/** All twenty battle moves share timing and cleanup, but keep their own choreography. */
export class PowerEffects {
  private vfx: AttackVfx;
  constructor(private scene: Phaser.Scene) {
    this.vfx = new AttackVfx(scene);
  }

  play(source: Actor, target: Actor, color: number, plan: AttackPresentation) {
    if (isHeroId(plan.fighterId)) {
      new HeroPowerEffects(this.scene).play(source, target, color, plan);
      return;
    }
    const d = source.x < target.x ? 1 : -1;
    switch (plan.fighterId) {
      case "ninja":
        this.ninja(source, target, color, plan, d);
        break;
      case "swordsman":
        this.swordsman(source, target, color, plan, d);
        break;
      case "hunter":
        this.hunter(source, target, color, plan, d);
        break;
      case "brawler":
        this.brawler(source, target, color, plan, d);
        break;
    }
  }

  private ninja(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x;
    switch (p.abilityId) {
      case "quick-strike":
        fighterMotion(this.scene, source, target, p, "dash");
        this.afterimages(source, target, "ninja", color, p, d, 3);
        this.vfx.after(p.impactMs, () => this.vfx.slash(target.x, 224, color, 0.9, -40 * d));
        break;
      case "shadow-clone":
        fighterMotion(this.scene, source, target, p, "cast");
        this.legion(source, target, color, p, d, "ninja", 3);
        break;
      case "crescent-barrage":
        fighterMotion(this.scene, source, target, p, "cast");
        this.vfx.charge(x, 222, color, 500, 6);
        this.legion(source, target, color, p, d, "ninja", 4);
        this.volley(x + d * 60, target.x, color, p, "crescent", 5, 85, 0.85);
        break;
      case "energy-sphere":
        fighterMotion(this.scene, source, target, p, "cast");
        this.vfx.charge(x + d * 65, 213, color, p.impactMs - 320, 12);
        this.energyBall(x + d * 65, target.x, color, p);
        break;
      case "celestial-tempest":
        fighterMotion(this.scene, source, target, p, "cast");
        this.vfx.charge(x, 224, color, 650, 8);
        new CelestialTempest(this.scene).play(source, target, color, p);
        break;
    }
  }

  private swordsman(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x;
    fighterMotion(this.scene, source, target, p, p.tier === "finisher" ? "cast" : "blade");
    switch (p.abilityId) {
      case "sword-slash":
        this.vfx.after(p.impactMs - 50, () =>
          this.vfx.slash(target.x - d * 20, 223, color, 1.1, -55 * d),
        );
        break;
      case "rapid-blade":
        for (let i = 0; i < 3; i++)
          this.vfx.after(p.impactMs - 220 + i * 110, () => {
            this.vfx.slash(target.x, 211 + i * 15, color, 1, (i % 2 ? 45 : -45) * d, 160);
            this.vfx.burst(target.x, 225, color, 0.35);
          });
        break;
      case "moonfall-cleave": {
        const moon = this.vfx.art((x + target.x) / 2, 179, 2).setAlpha(0);
        moon.fillStyle(color, 0.09).fillCircle(0, 0, 49);
        moon.lineStyle(2, color, 0.7).strokeCircle(0, 0, 39);
        this.scene.tweens.add({ targets: moon, alpha: 1, duration: 300 });
        this.vfx.fade(moon, 350, p.impactMs);
        this.vfx.after(p.impactMs - 330, () => {
          this.vfx.projectile(x + d * 65, 180, target.x, 244, color, 330, "crescent", 1.6);
        });
        this.vfx.after(p.impactMs, () => this.vfx.slash(target.x, 230, color, 1.7, -65 * d));
        break;
      }
      case "phantom-strike":
        this.afterimages(source, target, "swordsman", color, p, d, 5);
        this.scene.tweens.add({
          targets: source,
          alpha: 0.3,
          duration: 180,
          hold: p.impactMs - 360,
          yoyo: true,
        });
        for (let i = 0; i < 4; i++)
          this.vfx.after(p.impactMs - 420 + i * 140, () => {
            this.vfx.slash(
              target.x + (i % 2 ? 16 : -16),
              211 + (i % 2) * 24,
              color,
              1.35,
              (i % 2 ? 40 : -40) * d,
              180,
            );
          });
        this.vfx.after(p.impactMs, () => {
          this.vfx.slash(target.x, 232, 0xecfaff, 1.6, 45);
          this.vfx.slash(target.x, 232, color, 1.6, -45);
        });
        break;
      case "heaven-splitter":
        this.vfx.charge(x, 219, color, p.impactMs - 350, 14);
        this.heavenBlade(target.x, color, p);
        break;
    }
  }

  private hunter(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x;
    fighterMotion(this.scene, source, target, p, "cast");
    switch (p.abilityId) {
      case "shadow-strike":
        this.vfx.after(70, () =>
          this.vfx.projectile(x + d * 55, 223, target.x, 225, color, p.impactMs - 70, "bolt"),
        );
        break;
      case "shadow-summon":
        this.beast(source, target, color, p, d);
        break;
      case "night-warden":
        this.warden(source, target, color, p, d);
        break;
      case "shadow-army":
        this.vfx.charge(x, 225, color, 500, 7);
        this.legion(source, target, color, p, d, "hunter", 8);
        this.vfx.after(p.impactMs, () => this.vfx.ground(target.x, color, 1.5));
        break;
      case "eclipse-dominion": {
        const sun = this.vfx
          .art((x + target.x) / 2, 176, 2)
          .setScale(0.25)
          .setAlpha(0);
        sun.fillStyle(color, 0.13).fillCircle(0, 0, 60);
        sun.lineStyle(5, color, 0.8).strokeCircle(0, 0, 46);
        sun.fillStyle(0x030512).fillCircle(0, 0, 42);
        sun.lineStyle(1, 0xddaaff, 0.8).strokeCircle(0, 0, 52);
        this.scene.tweens.add({ targets: sun, scale: 1, alpha: 1, duration: 650 });
        this.vfx.fade(sun, 650, p.impactMs);
        this.legion(source, target, color, p, d, "hunter", 8);
        this.vfx.portal(target.x, 321, color, 80, p.impactMs + 150);
        this.vfx.after(p.impactMs - 240, () => {
          const pillar = this.vfx.art(target.x, 315, 7).setScale(1, 0.1);
          pillar.fillStyle(color, 0.12).fillRect(-48, -166, 96, 166);
          pillar.fillStyle(color, 0.4).fillTriangle(-25, 0, 0, -176, 25, 0);
          pillar.lineStyle(3, 0xe5cfff).lineBetween(0, 0, 0, -166);
          this.scene.tweens.add({ targets: pillar, scaleY: 1, duration: 240 });
          this.vfx.fade(pillar, 420, 240);
        });
        this.vfx.after(p.impactMs, () => {
          this.vfx.burst(target.x, 234, color, 3);
          this.vfx.ground(target.x, color, 3);
        });
        break;
      }
    }
  }

  private brawler(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x;
    const slam = p.abilityId === "power-smash" || p.abilityId === "worldbreaker";
    fighterMotion(this.scene, source, target, p, slam ? "slam" : "punch");
    switch (p.abilityId) {
      case "heavy-punch":
        this.vfx.after(p.impactMs - 120, () => {
          this.vfx.projectile(target.x - d * 125, 224, target.x, 224, color, 120, "wave", 0.5);
        });
        break;
      case "power-smash":
        this.vfx.charge(x, 234, color, p.impactMs - 240, 5);
        this.vfx.after(p.impactMs, () => {
          this.vfx.slash(target.x, 263, color, 1.25, 70 * d);
          this.vfx.ground(target.x, color, 1.7);
        });
        break;
      case "tidal-breaker":
        this.vfx.charge(x, 230, color, 500, 7);
        this.volley(x + d * 55, target.x, color, p, "wave", 3, 130, 1.05);
        this.vfx.after(p.impactMs, () => this.vfx.ground(target.x, color, 2));
        break;
      case "finisher":
        this.vfx.charge(x + d * 65, 220, color, p.impactMs - 300, 12);
        this.fist(x + d * 65, 223, target.x, color, p, d, false);
        break;
      case "worldbreaker":
        this.vfx.charge(x, 230, color, p.impactMs - 330, 14);
        this.fist((x + target.x) / 2, 188, target.x, color, p, d, true);
        this.vfx.after(p.impactMs, () => {
          this.vfx.ground(target.x, color, 3);
          this.vfx.ring(target.x, 319, color, 115, true, 90);
          this.vfx.ring(target.x, 319, color, 140, true, 180);
        });
        break;
    }
  }

  private volley(
    x: number,
    target: number,
    color: number,
    p: AttackPresentation,
    style: "crescent" | "wave",
    count: number,
    spacing: number,
    size: number,
  ) {
    for (let i = 0; i < count; i++)
      this.vfx.after(p.impactMs - 300 - (count - 1 - i) * spacing, () => {
        const y = style === "wave" ? 268 : 196 + (i % 3) * 28;
        this.vfx.projectile(
          x,
          y,
          target,
          style === "wave" ? 263 : 220 + (i % 3) * 10,
          color,
          300,
          style,
          size,
        );
        this.vfx.after(300, () => this.vfx.burst(target, 234, color, 0.55));
      });
  }

  private afterimages(
    source: Actor,
    target: Actor,
    kind: string,
    color: number,
    p: AttackPresentation,
    d: number,
    count: number,
  ) {
    const x = source.x;
    for (let i = 0; i < count; i++)
      this.vfx.after(p.impactMs - 210 + i * 35, () => {
        const distance = Math.abs(target.x - x) - 110;
        const ghost = makeFighter(
          this.scene,
          x + d * (20 + (i * distance) / count),
          color,
          d < 0,
          kind,
        )
          .setAlpha(0.2 + i * 0.03)
          .setDepth(4);
        this.vfx.fade(ghost, 130);
      });
  }

  private legion(
    source: Actor,
    target: Actor,
    color: number,
    p: AttackPresentation,
    d: number,
    kind: string,
    desired: number,
  ) {
    const gap = Math.abs(target.x - source.x);
    const columns = Math.min(gap < 380 ? 3 : 4, Math.ceil(desired / 2));
    const count = Math.min(desired, columns * 2);
    for (let i = 0; i < count; i++) {
      const column = Math.floor(i / 2);
      const row = i % 2;
      const x = source.x + d * (95 + (column * (gap - 190)) / Math.max(1, columns - 1));
      const y = row ? 323 : 236;
      const summonAt = i * 40;
      const launchAt = p.impactMs - 300 - (count - 1 - i) * 75;
      this.vfx.after(summonAt, () => {
        this.vfx.portal(x, y + 19, color, 25, launchAt - summonAt + 80);
        const shade = makeFighter(this.scene, x, color, d < 0, kind, kind === "hunter")
          .setName("battle-summon")
          .setDepth(6)
          .setY(y + 14)
          .setScale(d * 0.43, 0.43)
          .setAlpha(0);
        this.scene.tweens.add({
          targets: shade,
          y,
          alpha: 0.95,
          duration: 180,
          ease: "Sine.easeOut",
        });
        this.vfx.after(launchAt - summonAt, () => {
          this.scene.tweens.add({
            targets: shade,
            x: target.x - d * 40,
            y: row ? 287 : 235,
            angle: d * 12,
            duration: 230,
            ease: "Cubic.easeIn",
            onComplete: () => {
              this.vfx.slash(target.x, row ? 253 : 216, color, 0.65, row ? 40 : -40, 130);
              this.vfx.fade(shade, 100);
            },
          });
        });
      });
    }
  }

  private energyBall(x: number, target: number, color: number, p: AttackPresentation) {
    const ball = this.scene.add.container(x, 216).setDepth(8).setScale(0.15);
    const core = this.vfx.art(0, 0);
    core.fillStyle(color, 0.1).fillCircle(0, 0, 49);
    core.fillStyle(color, 0.4).fillCircle(0, 0, 34);
    core.fillStyle(0xbceaff).fillCircle(0, 0, 22);
    core.fillStyle(0xf3fcff).fillCircle(0, 0, 12);
    const orbit = this.vfx.art(0, 0);
    for (let i = 0; i < 3; i++) {
      orbit.lineStyle(2, i % 2 ? color : 0xe6faff, 0.9);
      orbit
        .beginPath()
        .arc(0, 0, 36 + i * 4, i * 2.1, i * 2.1 + 1.5)
        .strokePath();
    }
    ball.add([core, orbit]);
    this.scene.tweens.add({ targets: ball, scale: 1.15, duration: p.impactMs - 330 });
    this.scene.tweens.add({ targets: orbit, angle: 600, duration: p.impactMs });
    this.vfx.after(p.impactMs - 300, () => {
      this.scene.tweens.add({
        targets: ball,
        x: target,
        y: 229,
        duration: 300,
        ease: "Cubic.easeIn",
        onComplete: () => {
          ball.destroy();
          this.vfx.burst(target, 229, color, 2.5);
        },
      });
    });
  }

  private heavenBlade(x: number, color: number, p: AttackPresentation) {
    const blade = this.vfx.art(x, 186).setScale(0.15).setAlpha(0);
    blade.fillStyle(color, 0.1).fillTriangle(-49, -45, 49, -45, 0, 98);
    blade.fillStyle(color, 0.85).fillTriangle(-17, -44, 17, -44, 0, 86);
    blade.fillStyle(0xf1fbff).fillTriangle(-5, -44, 5, -44, 0, 86);
    blade.lineStyle(5, color).lineBetween(-34, -18, 34, -18);
    blade.lineStyle(4, 0xe8faff).lineBetween(0, -38, 0, -61);
    this.scene.tweens.add({ targets: blade, scale: 1.05, alpha: 1, duration: p.impactMs - 350 });
    this.vfx.after(p.impactMs - 280, () => {
      this.scene.tweens.add({ targets: blade, y: 223, duration: 280, ease: "Cubic.easeIn" });
    });
    this.vfx.fade(blade, 270, p.impactMs);
    this.vfx.after(p.impactMs, () => {
      const fissure = this.vfx.art(x, 140, 9);
      fissure.lineStyle(19, color, 0.16).lineBetween(0, 0, 0, 183);
      fissure.lineStyle(6, color).lineBetween(0, 0, 0, 183);
      fissure.lineStyle(2, 0xf4fdff).lineBetween(0, 0, 0, 183);
      this.vfx.fade(fissure, 400);
      this.vfx.slash(x, 242, color, 1.9, -45);
      this.vfx.slash(x, 242, 0xd2efff, 1.9, 45);
      this.vfx.ground(x, color, 2.5);
    });
  }

  private beast(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x + d * 100;
    this.vfx.portal(x, 319, color, 45, p.impactMs);
    const beast = this.scene.add
      .container(x, 325)
      .setScale(d * 0.8, 0.8)
      .setDepth(6)
      .setAlpha(0);
    const art = this.vfx.art(0, 0);
    art.fillStyle(0x10162e).fillEllipse(-5, -39, 83, 35);
    art.fillTriangle(15, -52, 45, -69, 57, -33);
    art.fillTriangle(32, -59, 30, -83, 46, -64);
    art.fillTriangle(-35, -43, -64, -72, -45, -32);
    art.lineStyle(2, color).lineBetween(-39, -48, 13, -54).lineBetween(13, -54, 44, -70);
    art.fillStyle(0xe8cfff).fillTriangle(34, -57, 47, -56, 37, -52);
    beast.add(art);
    for (let i = 0; i < 4; i++) {
      const leg = this.vfx.art(-26 + i * 17, -28);
      leg.lineStyle(7, 0x1c2444).lineBetween(0, 0, i % 2 ? 12 : -8, 26);
      leg.lineStyle(2, color, 0.75).lineBetween(0, 2, i % 2 ? 12 : -8, 26);
      beast.add(leg);
      this.scene.tweens.add({
        targets: leg,
        angle: i % 2 ? 22 : -22,
        duration: 110,
        yoyo: true,
        repeat: 2,
      });
    }
    this.scene.tweens.add({ targets: beast, alpha: 1, y: 313, duration: 230 });
    this.vfx.after(p.impactMs - 280, () => {
      this.scene.tweens.add({
        targets: beast,
        x: target.x - d * 45,
        duration: 280,
        ease: "Cubic.easeIn",
        onComplete: () => {
          for (let i = 0; i < 3; i++)
            this.vfx.slash(target.x - 10 + i * 12, 231 + i * 10, color, 0.7, -65, 190);
          this.vfx.fade(beast, 180);
        },
      });
    });
  }

  private warden(source: Actor, target: Actor, color: number, p: AttackPresentation, d: number) {
    const x = source.x + d * 110;
    this.vfx.portal(x, 319, color, 55, p.impactMs);
    const guardian = makeFighter(this.scene, x, color, d < 0, "hunter", true)
      .setDepth(6)
      .setY(313)
      .setScale(d * 0.9, 0.9)
      .setAlpha(0);
    // Animate the matching portrait weapon instead of drawing a second scythe.
    const scythe = guardian.getByName("lead-arm") as Actor;
    this.scene.tweens.add({ targets: guardian, y: 280, alpha: 1, duration: 350 });
    this.vfx.after(p.impactMs - 300, () => {
      this.scene.tweens.add({ targets: scythe, angle: 100, duration: 300, ease: "Cubic.easeIn" });
      this.vfx.projectile(x + d * 40, 217, target.x, 238, color, 300, "crescent", 1.5);
    });
    this.vfx.fade(guardian, 270, p.impactMs);
  }

  private fist(
    x: number,
    y: number,
    target: number,
    color: number,
    p: AttackPresentation,
    d: number,
    meteor: boolean,
  ) {
    const fist = this.vfx
      .art(x, y)
      .setScale(d * 0.1, 0.1)
      .setAngle(meteor ? d * 24 : 0);
    fist.fillStyle(color, 0.12).fillEllipse(-18, 0, 122, 94);
    fist.fillStyle(color, 0.95).fillRoundedRect(-32, -29, 65, 55, 12);
    fist.lineStyle(2, 0xffefdc).strokeRoundedRect(-32, -29, 65, 55, 12);
    fist.fillStyle(color).fillRoundedRect(4, 14, 39, 22, 8);
    for (let i = 0; i < 3; i++) fist.lineBetween(-18 + i * 17, -27, -18 + i * 17, -9);
    this.scene.tweens.add({
      targets: fist,
      scaleX: d * (meteor ? 1.25 : 1),
      scaleY: meteor ? 1.25 : 1,
      duration: p.impactMs - 330,
    });
    this.vfx.after(p.impactMs - 300, () => {
      this.scene.tweens.add({
        targets: fist,
        x: target,
        y: 246,
        duration: 300,
        ease: "Cubic.easeIn",
      });
    });
    this.vfx.fade(fist, 230, p.impactMs);
    this.vfx.after(p.impactMs, () => this.vfx.burst(target, 245, color, meteor ? 3 : 2));
  }
}
