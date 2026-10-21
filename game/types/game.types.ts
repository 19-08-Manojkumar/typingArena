export type Mode = "racing" | "battle" | "combat";
export type Difficulty = "easy" | "normal" | "hard";
export type PassageLength = "short" | "medium" | "long";
export type Faction = "hero" | "villain";
export type CharacterState = "correct" | "incorrect" | "pending";
export type TypingStatus = "idle" | "countdown" | "running" | "paused" | "complete";
export interface TypingStats {
  correct: number;
  incorrect: number;
  attempts: number;
  accuracy: number;
  wpm: number;
  elapsed: number;
  streak: number;
  bestStreak: number;
  wordCombo: number;
  bestWordCombo: number;
}
export interface TypingSnapshot extends TypingStats {
  passage: string;
  input: string;
  position: number;
  progress: number;
  states: CharacterState[];
  status: TypingStatus;
  countdown: number;
  remaining: number | null;
}
export interface TypingEvent {
  kind: "correct" | "incorrect" | "backspace" | "complete";
  rewarded: boolean;
  snapshot: TypingSnapshot;
}
export interface Ability {
  id: string;
  name: string;
  tier: "basic" | "special" | "advanced" | "ultimate" | "finisher";
  damage: number;
  cost: number;
  cooldown: number;
  text: string;
  effect: "slash" | "clones" | "orb" | "summon" | "impact";
}
export interface Fighter {
  id: string;
  faction: Faction;
  style: string;
  name: string;
  title: string;
  description: string;
  color: string;
  health: number;
  energy: number;
  speed: number;
  power: number;
  unlockLevel: number;
  abilities: Ability[];
}
export interface Vehicle {
  id: string;
  name: string;
  className: string;
  description: string;
  color: string;
  acceleration: number;
  handling: number;
  nitro: number;
  unlockLevel: number;
}
export interface GameResult extends TypingStats {
  id: string;
  mode: Mode;
  won: boolean;
  date: string;
  duration: number;
  xp: number;
  position?: number;
  damage?: number;
  rounds?: number;
  roundScores?: { round: number; dealt: number; taken: number; won: boolean }[];
}
export interface PlayerProfile {
  version: 1;
  displayName: string;
  xp: number;
  level: number;
  bestWpm: number;
  bestAccuracy: number;
  raceHistory: GameResult[];
  battleHistory: GameResult[];
  unlockedVehicles: string[];
  unlockedCharacters: string[];
  achievements: string[];
  settings: { sound: boolean; volume: number; difficulty: Difficulty; reducedMotion: boolean };
  preferredMode: Mode;
}
