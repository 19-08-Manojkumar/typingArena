import type { Ability, Difficulty } from "@/game/types/game.types";
import { battlePassageDeck, type BattlePassageDeck } from "@/game/systems/BattlePassageDeck";

const boxingPrompts = [
  "Find the opening and jab.",
  "Step inside and throw a cross.",
  "Keep your guard and hook.",
  "Let your feet lead the punch.",
  "Breathe out and strike clean.",
  "Turn your hips into the cross.",
  "A patient jab sets the pace.",
  "Stay light and land the hook.",
  "Set your feet and drive forward.",
  "Read the guard and uppercut.",
  "Move to the side and counter.",
  "Keep a rhythm through the round.",
];
const defenses: Record<Difficulty, string[]> = {
  easy: ["guard up", "step back", "duck low", "slip left", "stay safe", "hands up"],
  normal: [
    "slip and guard",
    "duck then block",
    "step back now",
    "keep hands high",
    "roll and cover",
    "guard the cross",
  ],
  hard: [
    "slip duck and guard",
    "roll under the hook",
    "block and step away",
    "duck then pivot left",
    "guard the uppercut",
    "slip past the cross",
  ],
};

/** Battle draws are persisted per attack; boxing retains its existing practice word pools. */
export class ChallengeDeck {
  private index: number;
  private battleDeck: BattlePassageDeck;
  constructor(seed?: number) {
    this.index = Math.abs(Math.floor(seed ?? Math.random() * 64));
    this.battleDeck = battlePassageDeck(seed);
  }
  battle(fighterId: string, ability: Ability, difficulty: Difficulty) {
    return this.battleDeck.next(fighterId, ability, difficulty);
  }
  boxing(beginner = false) {
    if (beginner) {
      const words = ["jab", "hit", "tap", "box", "go", "step", "hook", "left", "right", "punch"];
      return words[this.index++ % words.length];
    }
    return boxingPrompts[this.index++ % boxingPrompts.length].toLowerCase().replace(/[.]/g, "");
  }
  defense(difficulty: Difficulty, beginner = false) {
    if (beginner) {
      const words = ["up", "duck", "slip", "back"];
      return words[this.index++ % words.length];
    }
    return defenses[difficulty][this.index++ % defenses[difficulty].length];
  }
}
