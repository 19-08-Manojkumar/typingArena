import { calculateDamage, clamp } from "@/lib/scoring";
import type { Difficulty } from "@/game/types/game.types";
import type { AttackPerformance, CombatEffect } from "@/game/systems/CombatSystem";
import { boxingPresentation } from "@/game/systems/BoxingPresentation";
import { boxingOpponents, type BoxingOpponentId } from "@/game/data/boxingOpponents";

export interface RoundScore {
  round: number;
  dealt: number;
  taken: number;
  won: boolean;
}
export class BoxingSystem {
  readonly maxHealth = 150;
  health = 150;
  enemyHealth = 150;
  stamina = 100;
  round = 1;
  remaining: number;
  elapsed = 0;
  damageDealt = 0;
  combo = 0;
  momentum = 0;
  counterReady = false;
  private punches = 0;
  defending = false;
  defenseRemaining = 0;
  nextAttack = 7;
  intermission = 0;
  finished = false;
  won = false;
  roundScores: RoundScore[] = [];
  effect: CombatEffect = { serial: 0, source: "player", damage: 0, effect: "impact", name: "" };
  private dealtThisRound = 0;
  private takenThisRound = 0;
  private resolved = new Set<string>();
  private cooldown = 0;
  constructor(
    readonly difficulty: Difficulty,
    readonly roundDuration = 35,
    opponentId: BoxingOpponentId = "mantis",
  ) {
    this.opponent = boxingOpponents[opponentId];
    this.enemyHealth = this.opponent.health;
    this.nextAttack = this.opponent.beginner ? this.attackInterval() : 7;
    this.remaining = roundDuration;
  }
  readonly opponent: (typeof boxingOpponents)[BoxingOpponentId];
  get defenseWindow() {
    return this.opponent.beginner
      ? this.opponent.defenseWindow
      : { easy: 7, normal: 4, hard: 3.5 }[this.difficulty];
  }
  get guardAccuracy() {
    return this.opponent.beginner ? 60 : 80;
  }
  get staminaCost() {
    return this.opponent.beginner ? 10 : 18;
  }
  get defenseText() {
    return { easy: "guard up", normal: "slip and guard", hard: "slip duck and guard" }[
      this.difficulty
    ];
  }
  get multiplier() {
    return 1 + Math.min(this.combo, 5) * 0.1;
  }
  get nextMove() {
    return this.counterReady
      ? "counter"
      : this.momentum >= 3
        ? "uppercut"
        : ["jab", "cross", "hook"][this.punches % 3];
  }
  resolve(id: string, stats: AttackPerformance): number {
    if (this.finished || this.intermission > 0 || this.resolved.has(id)) return 0;
    this.resolved.add(id);
    if (this.defending) {
      const damage = stats.accuracy >= this.guardAccuracy ? 0 : this.opponent.beginner ? 2 : 5;
      this.receiveDamage(damage);
      this.defending = false;
      this.defenseRemaining = 0;
      this.nextAttack = this.attackInterval();
      this.stamina = clamp(this.stamina + (damage === 0 ? 18 : 5), 0, 100);
      this.counterReady = damage === 0;
      this.effect = {
        serial: this.effect.serial + 1,
        source: "opponent",
        damage,
        effect: "impact",
        name: damage === 0 ? "Perfect guard" : "Partial guard",
        presentation: boxingPresentation("guard", stats.accuracy),
      };
      this.checkKnockout();
      return 0;
    }
    if (this.stamina < this.staminaCost || this.cooldown > 0) {
      this.stamina = clamp(this.stamina + 12, 0, 100);
      this.combo = 0;
      this.effect = {
        serial: this.effect.serial + 1,
        source: "player",
        damage: 0,
        effect: "impact",
        name: "Recovering stamina",
        presentation: boxingPresentation("recover"),
      };
      return 0;
    }
    this.stamina = clamp(this.stamina - this.staminaCost, 0, 100);
    this.cooldown = 0.7;
    const move = this.nextMove;
    const bonus = move === "uppercut" ? 1.6 : move === "counter" ? 1.35 : 1;
    const damage = Math.min(
      this.enemyHealth,
      Math.round(
        calculateDamage(12, stats.accuracy, stats.wpm, stats.combo) * this.multiplier * bonus,
      ),
    );
    this.enemyHealth = clamp(this.enemyHealth - damage, 0, this.maxHealth);
    this.damageDealt += damage;
    this.dealtThisRound += damage;
    this.combo = stats.accuracy >= 90 ? Math.min(5, this.combo + 1) : 0;
    this.momentum =
      move === "uppercut" ? 0 : stats.accuracy >= 90 ? Math.min(3, this.momentum + 1) : 0;
    this.counterReady = false;
    this.punches++;
    this.effect = {
      serial: this.effect.serial + 1,
      source: "player",
      damage,
      effect: "impact",
      name:
        {
          jab: "Snap jab",
          cross: "One-two cross",
          hook: "Heavy hook",
          uppercut: "Power uppercut",
          counter: "Counter cross",
        }[move] ?? "Punch combination",
      presentation: boxingPresentation(move, stats.accuracy),
    };
    this.checkKnockout();
    return damage;
  }
  mistake() {
    this.combo = 0;
    this.momentum = 0;
    this.stamina = clamp(this.stamina - 1, 0, 100);
  }
  update(dt: number) {
    if (this.finished) return;
    this.elapsed += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.stamina = clamp(this.stamina + dt * 4, 0, 100);
    if (this.intermission > 0) {
      this.intermission = Math.max(0, this.intermission - dt);
      return;
    }
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 0) {
      this.endRound();
      return;
    }
    if (this.defending) {
      this.defenseRemaining -= dt;
      if (this.defenseRemaining <= 0) {
        const damage = this.opponent.beginner
          ? this.opponent.damage
          : { easy: 8, normal: 18, hard: 25 }[this.difficulty];
        this.receiveDamage(damage);
        this.effect = {
          serial: this.effect.serial + 1,
          source: "opponent",
          damage,
          effect: "impact",
          name: "Opponent combination",
          presentation: boxingPresentation("hook"),
        };
        this.defending = false;
        this.nextAttack = this.attackInterval();
        this.combo = 0;
        this.momentum = 0;
        this.counterReady = false;
      }
    } else {
      this.nextAttack -= dt;
      if (this.nextAttack <= 0) {
        this.defending = true;
        this.defenseRemaining = this.defenseWindow;
      }
    }
    this.checkKnockout();
  }
  private attackInterval() {
    return this.opponent.beginner
      ? this.opponent.attackInterval
      : { easy: 9, normal: 5, hard: 4 }[this.difficulty];
  }
  private receiveDamage(damage: number) {
    this.health = clamp(this.health - damage, 0, this.maxHealth);
    this.takenThisRound += damage;
  }
  private checkKnockout() {
    if (this.health <= 0 || this.enemyHealth <= 0) {
      this.roundScores.push({
        round: this.round,
        dealt: this.dealtThisRound,
        taken: this.takenThisRound,
        won: this.enemyHealth <= 0,
      });
      this.finished = true;
      this.won = this.enemyHealth <= 0 && this.health > 0;
    }
  }
  private endRound() {
    this.roundScores.push({
      round: this.round,
      dealt: this.dealtThisRound,
      taken: this.takenThisRound,
      won: this.dealtThisRound > this.takenThisRound,
    });
    if (this.round === 3) {
      this.finished = true;
      this.won = this.roundScores.filter((score) => score.won).length >= 2;
      return;
    }
    this.round++;
    this.remaining = this.roundDuration;
    this.intermission = 3;
    this.stamina = clamp(this.stamina + 30, 0, 100);
    this.dealtThisRound = this.takenThisRound = this.combo = 0;
    this.momentum = 0;
    this.counterReady = false;
    this.defending = false;
    this.defenseRemaining = 0;
    this.nextAttack = this.attackInterval();
  }
}
