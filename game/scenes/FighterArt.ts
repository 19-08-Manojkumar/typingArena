import * as Phaser from "phaser";
import { isPortraitFighter, makePortraitFighter } from "@/game/scenes/PortraitFighter";
import { BoxerRig } from "@/game/scenes/BoxerRig";
import { isHeroId } from "@/game/data/heroStyles";
import { makeHero } from "@/game/scenes/HeroFighterArt";

/** Shared portrait rigs; the boxing mode retains its existing dedicated rig. */
export function makeFighter(
  scene: Phaser.Scene,
  x: number,
  color: number,
  flip: boolean,
  archetype: string,
  shadow = false,
) {
  if (archetype === "boxer") return new BoxerRig(scene, x, color, flip);
  if (isHeroId(archetype) && !shadow) return makeHero(scene, x, color, flip, archetype);
  if (isPortraitFighter(archetype))
    return makePortraitFighter(scene, x, flip, archetype, shadow, color);
  const fighter = scene.add.container(x, 278);
  const g = scene.add.graphics();
  const boxing = archetype === "boxer" || archetype === "brawler";
  const body = shadow ? 0x111326 : color;
  g.fillStyle(0x030711, 0.4);
  g.fillEllipse(0, 42, 115, 22);
  if (archetype === "hunter" || shadow) {
    g.fillStyle(0x111827);
    g.fillTriangle(-38, -82, 39, -82, 58, 37);
    g.fillTriangle(-38, -82, -58, 37, 58, 37);
    g.lineStyle(2, color, 0.7);
    g.lineBetween(-38, -74, -56, 34);
    g.lineBetween(38, -74, 56, 34);
  }
  g.lineStyle(boxing ? 22 : 17, 0x10182a);
  g.lineBetween(-13, -2, -32, 39);
  g.lineBetween(13, -2, 35, 39);
  g.lineStyle(3, color, 0.75);
  g.lineBetween(-13, 3, -32, 37);
  g.lineBetween(13, 3, 35, 37);
  g.fillStyle(body);
  g.fillRoundedRect(boxing ? -32 : -26, -83, boxing ? 64 : 52, 88, 13);
  g.fillStyle(0x22293e);
  g.fillRect(-29, -15, 58, 10);
  g.fillStyle(shadow ? 0x121427 : boxing ? 0xc5909a : 0xa4a5c2);
  g.fillCircle(0, -108, 23);
  g.fillStyle(0x101529);
  g.fillEllipse(-4, -124, 51, 26);
  if (archetype === "hunter" || shadow) {
    g.fillStyle(0x101326);
    g.fillTriangle(-30, -95, 0, -151, 30, -95);
    g.lineStyle(2, color);
    g.lineBetween(-26, -99, 0, -145);
    g.lineBetween(0, -145, 26, -99);
    g.fillStyle(color);
    g.fillRect(-13, -112, 8, 3);
    g.fillRect(6, -112, 8, 3);
  } else if (archetype === "ninja") {
    g.fillStyle(0x17203c);
    g.fillRect(-23, -106, 46, 20);
    g.fillStyle(color);
    g.fillTriangle(-24, -99, -86, -73, -25, -81);
    g.lineStyle(2, 0xe1eaff);
    g.lineBetween(4, -112, 16, -114);
  } else if (archetype === "swordsman") {
    g.fillStyle(0xe4ecff, 0.8);
    g.fillTriangle(-26, -86, 5, -78, -2, -17);
    g.fillStyle(0x182239);
    g.fillTriangle(-25, -126, -37, -147, 10, -126);
  } else if (archetype === "brawler") {
    g.lineStyle(5, color);
    g.lineBetween(-23, -120, 21, -120);
    g.fillStyle(0x293146);
    g.fillTriangle(-12, -83, 12, -83, 0, -33);
  }
  fighter.add(g);
  for (const lead of [false, true]) {
    const arm = scene.add.container(lead ? 22 : -22, -68).setName(lead ? "lead-arm" : "rear-arm");
    const art = scene.add.graphics();
    art.lineStyle(boxing ? 19 : 14, shadow ? 0x181d32 : boxing ? 0xc18b95 : color);
    if (lead) art.lineBetween(0, 0, 25, 22).lineBetween(25, 22, 38, -9);
    else art.lineBetween(0, 0, -22, 37);
    art.fillStyle(body);
    art.fillRoundedRect(lead ? 25 : -37, lead ? -27 : 24, boxing ? 34 : 26, 30, 9);
    if (lead && archetype === "swordsman") {
      // The blade now follows the wrist instead of remaining painted onto the torso.
      art.lineStyle(7, color, 0.2).lineBetween(40, -5, 70, -82);
      art.lineStyle(4, 0xdbe8ff).lineBetween(40, -5, 70, -82);
      art.lineStyle(3, color).lineBetween(33, -18, 53, -12);
    }
    art.lineStyle(2, 0xf0edff, 0.45);
    if (lead) art.lineBetween(31, -21, 44, -21);
    arm.add(art);
    fighter.add(arm);
  }
  fighter.setScale(flip ? -1 : 1, 1);
  return fighter;
}
