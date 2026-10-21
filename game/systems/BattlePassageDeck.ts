import type { Ability, Difficulty } from "@/game/types/game.types";
import {
  battleActions,
  battleManners,
  battleReflections,
  battleResolutions,
  battleScenes,
  battleSettings,
  battleTactics,
} from "@/game/data/battlePassageParts";

import {
  shortBattleActions,
  shortBattleSettings,
  shortBattleManners,
  shortBattleEndings,
  normalBattleFollowups,
  normalBattleFinishes,
} from "@/game/data/battleShortPassageParts";

export const BATTLE_PASSAGE_STORAGE_KEY = "typing-arena:battle-passages:v2";
type DrawState = { cursor: number; offset: number; step: number; size: number; last: number };
export type BattlePassageState = { version: 1; decks: Record<string, DrawState> };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const valid = (value: unknown): value is DrawState => {
  if (!value || typeof value !== "object") return false;
  const item = value as DrawState;
  return (
    [item.cursor, item.offset, item.step, item.size, item.last].every(Number.isSafeInteger) &&
    item.size > 1 &&
    item.cursor >= 0 &&
    item.cursor <= item.size &&
    item.offset >= 0 &&
    item.offset < item.size &&
    item.step > 0 &&
    item.step < item.size &&
    gcd(item.step, item.size) === 1 &&
    item.last >= -1 &&
    item.last < item.size
  );
};

/** A permutation visits every combination once. Only five numbers per attack need to be saved. */
export class BattlePassageDeck {
  private decks = new Map<string, DrawState>();
  private seed: number;
  constructor(
    seed = Math.floor(Math.random() * 0xffffffff),
    state?: unknown,
    private save?: (state: BattlePassageState) => void,
  ) {
    this.seed = Number.isFinite(seed) ? Math.floor(seed) >>> 0 : 0;
    if (
      state &&
      typeof state === "object" &&
      "version" in state &&
      state.version === 1 &&
      "decks" in state &&
      state.decks &&
      typeof state.decks === "object"
    ) {
      for (const [key, value] of Object.entries(state.decks).slice(0, 128)) {
        if (/^[a-z0-9-]+:[a-z0-9-]+(?::(?:easy|normal))?$/.test(key) && valid(value))
          this.decks.set(key, { ...value });
      }
    }
  }

  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  private fresh(size: number, last = -1): DrawState {
    const offset = Math.floor(this.random() * size);
    let step = 1 + Math.floor(this.random() * (size - 1));
    while (gcd(step, size) !== 1) step = step + 1 >= size ? 1 : step + 1;
    return { cursor: 0, offset, step, size, last };
  }

  next(fighterId: string, ability: Ability, difficulty: Difficulty): string {
    const rank = ["basic", "special", "advanced", "ultimate", "finisher"].indexOf(ability.tier);
    const actions = battleActions[ability.id] ?? [
      ability.text.toLowerCase().replace(/[.!?]+$/, ""),
    ];
    const groups: (readonly string[])[] =
      difficulty === "easy"
        ? [shortBattleSettings, shortBattleActions[ability.id] ?? actions, shortBattleManners]
        : difficulty === "normal"
          ? [shortBattleSettings, actions, shortBattleManners]
          : [battleSettings, actions, battleManners];
    if (difficulty === "hard") {
      if (rank >= 2) groups.push(battleScenes);
      if (rank >= 3) groups.push(battleTactics);
      if (rank >= 1) groups.push(battleReflections);
      if (rank >= 4) groups.push(battleResolutions);
    } else if (difficulty === "normal" && rank >= 2) {
      groups.push(rank === 4 ? normalBattleFinishes : normalBattleFollowups);
    }
    const size = groups.reduce((total, group) => total * group.length, 1);
    // Keep Hard's original saved deck. Short prompts have independent progress, so switching
    // difficulty never resets another difficulty's permutation or repeats discarded sentences.
    const key =
      difficulty === "hard"
        ? `${fighterId}:${ability.id}`
        : `${fighterId}:${ability.id}:${difficulty}`;
    let state = this.decks.get(key);
    if (!state || state.size !== size) state = this.fresh(size);
    else if (state.cursor === size) state = this.fresh(size, state.last);
    // BigInt keeps the permutation exact even for the largest finisher paragraph pool.
    const indexAt = (cursor: number) =>
      Number((BigInt(state.offset) + BigInt(cursor) * BigInt(state.step)) % BigInt(size));
    let index = indexAt(state.cursor++);
    if (index === state.last) index = indexAt(state.cursor++);
    state.last = index;
    this.decks.set(key, state);
    const parts = groups.map((group) => {
      const part = group[index % group.length];
      index = Math.floor(index / group.length);
      return part;
    });
    const sentences = [`${parts[0]}, ${parts[1]} ${parts[2]}.`];
    if (difficulty === "normal" || (difficulty === "easy" && rank === 4))
      sentences.push(shortBattleEndings[state.last % shortBattleEndings.length]);
    sentences.push(...parts.slice(3));
    const text = sentences.join(" ");
    this.save?.(this.snapshot());
    return difficulty === "easy"
      ? text
          .toLowerCase()
          .replace(/[^a-z ]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      : text;
  }

  snapshot(): BattlePassageState {
    return {
      version: 1,
      decks: Object.fromEntries([...this.decks].map(([key, value]) => [key, { ...value }])),
    };
  }
}

let shared: BattlePassageDeck | undefined;

/** Explicit seeds stay isolated for tests. Ordinary battles share progress across replays/reloads. */
export function battlePassageDeck(seed?: number) {
  if (seed !== undefined) return new BattlePassageDeck(seed);
  if (!shared) {
    let saved: unknown;
    try {
      if (typeof window !== "undefined")
        saved = JSON.parse(window.localStorage.getItem(BATTLE_PASSAGE_STORAGE_KEY) ?? "null");
    } catch {
      /* Unavailable storage must not prevent typing practice. */
    }
    shared = new BattlePassageDeck(undefined, saved, (state) => {
      try {
        if (typeof window !== "undefined")
          window.localStorage.setItem(BATTLE_PASSAGE_STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* The in-memory deck still prevents repeats in this session. */
      }
    });
  }
  return shared;
}
