import type { Ability, Difficulty } from "@/game/types/game.types";

const openings: Record<string, string[]> = {
  ninja: [
    "Move with the wind",
    "Slip through the mist",
    "Trust the silent step",
    "Follow the moonlight",
    "Let the shadows guide you",
    "Find the hidden path",
    "Keep your spirit steady",
    "Dance beyond their reach",
  ],
  swordsman: [
    "Keep the blade steady",
    "Read the opening",
    "Follow the silver edge",
    "Let your focus settle",
    "Hold the perfect stance",
    "Strike with purpose",
    "Trust the patient hand",
    "Find balance in motion",
  ],
  hunter: [
    "Listen to the darkness",
    "Walk beyond the lanterns",
    "Call upon the night",
    "Let the shadows gather",
    "Watch the silent horizon",
    "Command the hidden force",
    "Trust the unseen guardian",
    "Follow the fading stars",
  ],
  brawler: [
    "Plant your feet firmly",
    "Put your heart into it",
    "Stand against the tide",
    "Keep your courage close",
    "Find strength in the storm",
    "Move like the ocean",
    "Trust your fighting spirit",
    "Meet the challenge head on",
  ],
};
const endings: Record<Ability["tier"], string[]> = {
  basic: [
    "and strike.",
    "then act.",
    "and advance.",
    "with focus.",
    "and commit.",
    "stay calm.",
    "then move.",
    "with care.",
  ],
  special: [
    "and turn a quiet moment into power.",
    "as your hidden strength awakens.",
    "and let the next move change the battle.",
    "until every motion finds its purpose.",
    "as your rival leaves an opening.",
    "and gather the courage to break through.",
    "while the arena holds its breath.",
    "and make your rhythm impossible to ignore.",
  ],
  advanced: [
    "and shape the gathered power into a strike that breaks their defense.",
    "as a greater force awakens and follows your every command.",
    "and guide your growing strength through the heart of the battle.",
    "until every careful movement becomes a wave of relentless power.",
    "as the hidden guardian rises to stand beside you in the arena.",
    "and carry the force of your training beyond the edge of doubt.",
    "while the next attack gathers enough strength to turn the tide.",
    "and unleash a precise surge of power through the open guard.",
  ],
  ultimate: [
    "as every spark becomes a storm and your full strength answers the call.",
    "and bring the gathered force of every perfect word into one decisive strike.",
    "until the entire arena trembles beneath the power you have awakened.",
    "as the final moment arrives and all your training becomes a single motion.",
    "and send a wave of unstoppable resolve across the silent battlefield.",
    "while a thousand echoes carry your command beyond the edge of night.",
    "and turn the strength of your spirit into a force that fills the sky.",
    "as every shadow rises to deliver the attack that will decide this battle.",
  ],
  finisher: [
    "as the sky opens and your entire spirit becomes a storm that no rival can withstand.",
    "and summon the greatest force within you to bring this battle to a thunderous conclusion.",
    "until the world falls silent before the final wave of power rising from your hands.",
    "as every shadow and every spark unite beneath your command for one overwhelming attack.",
    "and release the full strength of your training in a strike that shakes the horizon.",
    "while the arena trembles and your gathered energy breaks free in a brilliant final surge.",
    "and draw upon every perfect word to deliver a decisive blow that echoes beyond the stars.",
    "as the ultimate force awakens and carries your final command across the entire battlefield.",
  ],
};
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

/** A local per-session sequence changes every challenge, including ability switches. */
export class ChallengeDeck {
  private index: number;
  constructor(seed = Math.floor(Math.random() * 64)) {
    this.index = Math.abs(Math.floor(seed));
  }
  battle(fighterId: string, ability: Ability, difficulty: Difficulty) {
    const index = this.index++;
    const starts = openings[fighterId] ?? openings.ninja;
    const start = starts[index % starts.length];
    const ending =
      endings[ability.tier][
        (Math.floor(index / starts.length) + index) % endings[ability.tier].length
      ];
    const text = `${start} ${ending}`;
    return difficulty === "easy" ? text.toLowerCase().replace(/[.,]/g, "") : text;
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
