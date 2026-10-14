import * as Phaser from "phaser";

/** Original procedural silhouettes; also reused by clones and shadow summons. */
export function makeFighter(
  scene: Phaser.Scene,
  x: number,
  color: number,
  flip: boolean,
  archetype: string,
  shadow = false,
) {
  if (archetype === "boxer") return makeBoxer(scene, x, color, flip);
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
  g.lineStyle(boxing ? 19 : 14, shadow ? 0x181d32 : boxing ? 0xc18b95 : color);
  g.lineBetween(-22, -68, -44, -31);
  g.lineBetween(22, -68, 47, -46);
  g.lineBetween(47, -46, 60, -77);
  g.fillStyle(body);
  g.fillRoundedRect(47, -95, boxing ? 34 : 26, 30, 9);
  g.fillRoundedRect(-59, -44, boxing ? 30 : 23, 28, 8);
  if (archetype === "swordsman") {
    g.lineStyle(6, 0xdbe8ff);
    g.lineBetween(62, -73, 100, -172);
    g.lineStyle(3, color);
    g.lineBetween(55, -86, 76, -80);
  }
  g.lineStyle(2, 0xf0edff, 0.35);
  g.lineBetween(53, -89, 66, -89);
  fighter.add(g);
  fighter.setScale(flip ? -1 : 1, 1);
  return fighter;
}

function makeBoxer(scene: Phaser.Scene, x: number, color: number, flip: boolean) {
  const fighter = scene.add.container(x, 278);
  const body = scene.add.graphics();
  body.fillStyle(0x030711, 0.5).fillEllipse(0, 42, 105, 20);
  body.lineStyle(18, 0x1b233b);
  body.lineBetween(-14, -2, -31, 35).lineBetween(12, -2, 33, 35);
  body.fillStyle(color).fillRoundedRect(-45, 28, 32, 14, 4).fillRoundedRect(21, 28, 32, 14, 4);
  body.fillStyle(flip ? 0x9e6870 : 0xd6a081).fillRoundedRect(-29, -85, 59, 72, 16);
  body.lineStyle(2, 0xf9d3b1, 0.3).lineBetween(-18, -66, 18, -66);
  body.fillStyle(color).fillRoundedRect(-30, -24, 60, 34, 5);
  body.fillStyle(0xf1eddf).fillRect(-30, -24, 60, 8);
  body.fillStyle(0x172035).fillRect(-5, -16, 10, 25);
  body.fillStyle(flip ? 0xb37d80 : 0xe5b295).fillRoundedRect(-17, -125, 38, 42, 12);
  body.fillStyle(0x172035).fillRoundedRect(-20, -133, 41, 17, 7);
  body.fillStyle(0xf0f5ff).fillRect(8, -112, 8, 3);
  body.lineStyle(3, 0x734c55).lineBetween(11, -96, 20, -98);
  fighter.add(body);
  for (const [name, shoulderX, shoulderY] of [
    ["rear-glove", -20, -67],
    ["lead-glove", 22, -72],
  ] as const) {
    const arm = scene.add.container(shoulderX, shoulderY).setName(name);
    const art = scene.add.graphics();
    art.lineStyle(15, flip ? 0xb37d80 : 0xe5b295);
    art.lineBetween(0, 0, 17, 14).lineBetween(17, 14, 31, -18);
    art.fillStyle(0xe6e9f3).fillRoundedRect(20, -23, 22, 13, 3);
    art.fillStyle(color).fillRoundedRect(18, -43, 34, 29, 10);
    art.fillStyle(0xffffff, 0.28).fillRoundedRect(24, -39, 19, 5, 2);
    art.lineStyle(2, 0x131c30, 0.6).lineBetween(24, -20, 44, -20);
    arm.add(art);
    fighter.add(arm);
  }
  return fighter.setScale(flip ? -1 : 1, 1);
}
