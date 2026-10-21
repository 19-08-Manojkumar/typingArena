import { abilities } from "@/game/data/abilities";
import type { Fighter } from "@/game/types/game.types";
import { heroAbilities } from "@/game/data/heroAbilities";
export const villains: Fighter[] = [
  {
    id: "ninja",
    faction: "villain",
    style: "Shadow clones · swift assassin",
    name: "Shadow Ninja",
    title: "THE SILENT TEMPEST",
    description:
      "A silent rival who commands a storm of shadow clones and an overwhelming celestial tempest.",
    color: "#a78bfa",
    health: 145,
    energy: 150,
    speed: 1.15,
    power: 1,
    unlockLevel: 1,
    abilities: abilities.ninja,
  },
  {
    id: "swordsman",
    faction: "villain",
    style: "Phantom blade · precise duelist",
    name: "Precision Swordsman",
    title: "THE SILVER EDGE",
    description: "A disciplined duelist. Each deliberate keystroke sharpens an unstoppable blade.",
    color: "#73b7ff",
    health: 160,
    energy: 160,
    speed: 1,
    power: 1.08,
    unlockLevel: 1,
    abilities: abilities.swordsman,
  },
  {
    id: "hunter",
    faction: "villain",
    style: "Shadow summons · legion commander",
    name: "Dark Hunter",
    title: "KEEPER OF THE NIGHT",
    description: "A patient summoner whose shadows gather strength with every perfect word.",
    color: "#68d8c0",
    health: 150,
    energy: 175,
    speed: 0.92,
    power: 1.13,
    unlockLevel: 1,
    abilities: abilities.hunter,
  },
  {
    id: "brawler",
    faction: "villain",
    style: "Tidal fists · heavy brawler",
    name: "Pirate Brawler",
    title: "THE UNBROKEN TIDE",
    description: "A fearless adventurer with a heavy fist and a heart that never backs down.",
    color: "#ff9a83",
    health: 190,
    energy: 160,
    speed: 0.85,
    power: 1.18,
    unlockLevel: 1,
    abilities: abilities.brawler,
  },
];

export const heroes: Fighter[] = [
  {
    id: "solar",
    faction: "hero",
    name: "Solar Knight",
    title: "KEEPER OF THE DAWN",
    description:
      "A noble knight in bright armor. Sword arcs, shield charges, and the power of the sun lead the way.",
    style: "Radiant sword + shield · close combat",
    color: "#ffd27a",
    health: 175,
    energy: 165,
    speed: 0.95,
    power: 1.1,
    unlockLevel: 1,
    abilities: heroAbilities.solar,
  },
  {
    id: "storm",
    faction: "hero",
    name: "Storm Ranger",
    title: "ARROW OF THE OPEN SKY",
    description:
      "A quick and clear-eyed archer. Lightning arrows and whirling winds reward a steady, accurate rhythm.",
    style: "Lightning bow · ranged strikes",
    color: "#6eddf2",
    health: 145,
    energy: 170,
    speed: 1.18,
    power: 1,
    unlockLevel: 1,
    abilities: heroAbilities.storm,
  },
  {
    id: "crystal",
    faction: "hero",
    name: "Crystal Sage",
    title: "VOICE OF THE STARLIGHT",
    description:
      "A kindhearted mage with a crystal staff. Blooming spires, orbiting gems, and aurora beams shape the battle.",
    style: "Crystal staff · spellcaster",
    color: "#b4c7ff",
    health: 150,
    energy: 185,
    speed: 0.98,
    power: 1.05,
    unlockLevel: 1,
    abilities: heroAbilities.crystal,
  },
  {
    id: "ember",
    faction: "hero",
    name: "Ember Guardian",
    title: "HEART OF THE PHOENIX",
    description:
      "A warmhearted protector with powerful flame gauntlets. Rising punches and phoenix wings bring courage to life.",
    style: "Flame gauntlets · powerful brawler",
    color: "#ffb477",
    health: 195,
    energy: 155,
    speed: 0.85,
    power: 1.14,
    unlockLevel: 1,
    abilities: heroAbilities.ember,
  },
];

// Preserve the original fighters' indices for saved integrations and animation fixtures.
export const characters: Fighter[] = [...villains, ...heroes];
export const fightersFor = (faction: Fighter["faction"]) =>
  faction === "hero" ? heroes : villains;
export const opponentsFor = (fighter: Fighter) =>
  fightersFor(fighter.faction === "hero" ? "villain" : "hero");
