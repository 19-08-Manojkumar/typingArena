import type * as Phaser from "phaser";
import type { HeroId } from "@/game/data/heroStyles";
import { makePortraitFighter } from "@/game/scenes/PortraitFighter";

export function makeHero(
  scene: Phaser.Scene,
  x: number,
  _color: number,
  flip: boolean,
  hero: HeroId,
) {
  return makePortraitFighter(scene, x, flip, hero);
}
