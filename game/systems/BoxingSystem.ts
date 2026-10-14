import { calculateDamage, clamp } from "@/lib/scoring";
import type { Difficulty } from "@/game/types/game.types";
import type { AttackPerformance, CombatEffect } from "@/game/systems/CombatSystem";

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
  ) {
    this.remaining = roundDuration;
  }
  get defenseText() {
    return { easy: "guard up", normal: "slip and guard", hard: "slip duck and guard" }[
      this.difficulty
    ];
  }
  get multiplier() {
    return 1 + Math.min(this.combo, 5) * 0.1;
  }
  resolve(id: string, stats: AttackPerformance): number {
    if (this.finished || this.intermission > 0 || this.resolved.has(id)) return 0;
    this.resolved.add(id);
    if (this.defending) {
      const damage = stats.accuracy >= 80 ? 0 : 5;
      this.receiveDamage(damage);
      this.defending = false;
      this.defenseRemaining = 0;
      this.nextAttack = this.attackInterval();
      this.stamina = clamp(this.stamina + (damage === 0 ? 18 : 5), 0, 100);
      this.effect = {
        serial: this.effect.serial + 1,
        source: "opponent",
        damage,
        effect: "impact",
        name: damage === 0 ? "Perfect guard" : "Partial guard",
      };
      return 0;
    }
    if (this.stamina < 18 || this.cooldown > 0) {
      this.stamina = clamp(this.stamina + 12, 0, 100);
      this.combo = 0;
      this.effect = {
        serial: this.effect.serial + 1,
        source: "player",
        damage: 0,
        effect: "impact",
        name: "Recovering stamina",
      };
      return 0;
    }
    this.stamina = clamp(this.stamina - 18, 0, 100);
    this.cooldown = 0.7;
    const damage = Math.min(
      this.enemyHealth,
      Math.round(calculateDamage(12, stats.accuracy, stats.wpm, stats.combo) * this.multiplier),
    );
    this.enemyHealth = clamp(this.enemyHealth - damage, 0, this.maxHealth);
    this.damageDealt += damage;
    this.dealtThisRound += damage;
    this.combo = stats.accuracy >= 90 ? Math.min(5, this.combo + 1) : 0;
    this.effect = {
      serial: this.effect.serial + 1,
      source: "player",
      damage,
      effect: "impact",
      name: "Punch combination",
    };
    this.checkKnockout();
    return damage;
  }
  mistake() {
    this.combo = 0;
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
        const damage = { easy: 12, normal: 18, hard: 25 }[this.difficulty];
        this.receiveDamage(damage);
        this.effect = {
          serial: this.effect.serial + 1,
          source: "opponent",
          damage,
          effect: "impact",
          name: "Opponent combination",
        };
        this.defending = false;
        this.nextAttack = this.attackInterval();
        this.combo = 0;
      }
    } else {
      this.nextAttack -= dt;
      if (this.nextAttack <= 0) {
        this.defending = true;
        this.defenseRemaining = { easy: 4.5, normal: 4, hard: 3.5 }[this.difficulty];
      }
    }
    this.checkKnockout();
  }
  private attackInterval() {
    return { easy: 6, normal: 5, hard: 4 }[this.difficulty];
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
    this.defending = false;
    this.defenseRemaining = 0;
    this.nextAttack = this.attackInterval();
  }
}
