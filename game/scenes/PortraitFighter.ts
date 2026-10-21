import * as Phaser from "phaser";
import {
  fighterRigs,
  portraitAtlas,
  type PortraitFighterId,
} from "@/game/data/fighterRigs.generated";

type Actor = Phaser.GameObjects.Container;

/** One shared atlas, loaded only by fighting scenes. No textures are created during attacks. */
export function preloadFighterArt(scene: Phaser.Scene) {
  if (!scene.textures.exists(portraitAtlas.key))
    scene.load.atlas(portraitAtlas.key, portraitAtlas.image, portraitAtlas.data);
}

export function isPortraitFighter(id: string): id is PortraitFighterId {
  return Object.hasOwn(fighterRigs, id);
}

/** The actual card artwork, articulated at its shoulders, hips and cape attachment. */
export function makePortraitFighter(
  scene: Phaser.Scene,
  x: number,
  flip: boolean,
  id: PortraitFighterId,
  shadow = false,
  shadowColor = 0x70a4b3,
) {
  const rig = fighterRigs[id];
  const actor = scene.add
    .container(x, 278)
    .setName(`fighter-${id}`)
    .setScale(flip ? -1 : 1, 1);
  actor.setData("portraitId", id);
  const floor = scene.add.graphics().setName("hero-shadow");
  floor.fillStyle(0x030711, 0.32).fillEllipse(0, 43, id === "brawler" ? 144 : 115, 17);
  actor.add(floor);
  const parts = new Map<string, Actor>();
  for (const layer of rig.layers) {
    const name = layer.part.endsWith("arm") ? layer.part : `hero-${layer.part}`;
    const part = scene.add
      .container(
        (layer.pivot[0] - rig.origin[0]) * rig.scale,
        (layer.pivot[1] - rig.origin[1]) * rig.scale,
      )
      .setName(name);
    const art = scene.add
      .image(
        (layer.x - layer.pivot[0]) * rig.scale,
        (layer.y - layer.pivot[1]) * rig.scale,
        portraitAtlas.key,
        layer.frame,
      )
      .setOrigin(0)
      .setDisplaySize(layer.width * rig.scale, layer.height * rig.scale);
    if (shadow) art.setTint(shadowColor).setAlpha(0.78);
    part.add(art);
    actor.add(part);
    parts.set(layer.part, part);
  }
  // Cloaked characters still expose the same joints as every other rig.
  for (const name of ["rear-leg", "lead-leg", "cape", "rear-arm", "lead-arm"]) {
    if (!parts.has(name))
      actor.add(scene.add.container(0, 0).setName(name.endsWith("arm") ? name : `hero-${name}`));
  }
  return actor;
}

/** Resolve an effect origin through the current arm, actor rotation, mirroring and scale. */
export function fighterSocket(actor: Actor, name: string, offsetX = 0, offsetY = 0) {
  const id = actor.getData("portraitId") as PortraitFighterId | undefined;
  const sockets = id ? fighterRigs[id].sockets : undefined;
  const socket = sockets && name in sockets ? sockets[name as keyof typeof sockets] : undefined;
  if (socket) {
    const part = actor.getByName(socket.part) as Actor;
    return part.getWorldTransformMatrix().transformPoint(socket.x + offsetX, socket.y + offsetY);
  }
  return actor.getWorldTransformMatrix().transformPoint(offsetX, -80 + offsetY);
}

/** Keep contact shadows on the arena floor while a character leaps or leans. */
export function updateFighterShadow(actor: Actor) {
  if (!actor.getData("portraitId")) return;
  const floor = actor.getByName("hero-shadow") as Phaser.GameObjects.Graphics;
  const point = actor.getWorldTransformMatrix().applyInverse(actor.x, 321);
  const angle = -(actor.scaleX < 0 ? -1 : 1) * actor.rotation;
  const clean = (value: number) => (Math.abs(value) < 1e-8 ? 0 : value);
  floor.setPosition(clean(point.x + 43 * Math.sin(angle)), clean(point.y - 43 * Math.cos(angle)));
  floor.setRotation(clean(angle));
  floor.setAlpha(Math.max(0.22, 1 - Math.max(0, 278 - actor.y) / 180));
}
