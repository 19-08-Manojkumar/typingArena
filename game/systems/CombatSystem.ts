import type { Ability, Difficulty, Fighter } from "@/game/types/game.types";
import { calculateDamage, clamp } from "@/lib/scoring";
import { attackPresentation, type AttackPresentation } from "@/game/systems/AttackPresentation";
export interface AttackPerformance {
  accuracy: number;
  wpm: number;
  combo: number;
}
export interface CombatEffect {
  serial: number;
  source: "player" | "opponent";
  damage: number;
  effect: Ability["effect"];
  name: string;
  presentation?: AttackPresentation;
}
export class CombatSystem {
  health: number;
  enemyHealth: number;
  readonly enemyMaxHealth: number;
  energy = 20;
  elapsed = 0;
  damageDealt = 0;
  nextAttack: number;
  finished = false;
  won = false;
  pendingAttack: {
    damage: number;
    elapsed: number;
    impacted: boolean;
    presentation: AttackPresentation;
  } | null = null;
  effect: CombatEffect = { serial: 0, source: "player", damage: 0, effect: "slash", name: "" };
  private resolved = new Set<string>();
  private cooldowns = new Map<string, number>();
  readonly attackInterval: number;
  constructor(
    readonly player: Fighter,
    readonly opponent: Fighter,
    readonly difficulty: Difficulty,
    readonly level = 1,
  ) {
    this.health = player.health;
    this.enemyMaxHealth = Math.round(
      opponent.health * { easy: 0.85, normal: 1, hard: 1.12 }[difficulty],
    );
    this.enemyHealth = this.enemyMaxHealth;
    this.attackInterval = { easy: 7, normal: 5.8, hard: 4.5 }[difficulty] / opponent.speed;
    this.nextAttack = this.attackInterval;
  }
  cooldown(ability: Ability) {
    return Math.max(0, (this.cooldowns.get(ability.id) ?? 0) - this.elapsed);
  }
  canUse(ability: Ability) {
    return (
      !this.finished &&
      !this.pendingAttack &&
      this.player.abilities.some((a) => a.id === ability.id) &&
      this.energy >= ability.cost &&
      this.cooldown(ability) === 0
    );
  }
  charge(amount: number) {
    this.energy = clamp(this.energy + amount, 0, this.player.energy);
  }
  resolve(challengeId: string, ability: Ability, stats: AttackPerformance): number {
    if (this.resolved.has(challengeId) || !this.canUse(ability)) return 0;
    this.resolved.add(challengeId);
    this.energy = clamp(this.energy - ability.cost, 0, this.player.energy);
    this.cooldowns.set(ability.id, this.elapsed + ability.cooldown);
    const damage = Math.min(
      this.enemyHealth,
      calculateDamage(ability.damage, stats.accuracy, stats.wpm, stats.combo, this.player.power),
    );
    if (ability.tier === "basic") this.charge(12);
    const presentation = attackPresentation(
      ability,
      this.player.id,
      stats.accuracy,
      stats.wpm,
      this.level,
    );
    this.pendingAttack = { damage, elapsed: 0, impacted: false, presentation };
    this.effect = {
      serial: this.effect.serial + 1,
      source: "player",
      damage,
      effect: ability.effect,
      name: ability.name,
      presentation,
    };
    this.checkFinish();
    return damage;
  }
  update(dt: number) {
    if (this.finished) return;
    this.elapsed += dt;
    this.charge(dt * 0.75);
    if (this.pendingAttack) {
      const attack = this.pendingAttack;
      attack.elapsed += dt * 1000;
      if (!attack.impacted && attack.elapsed >= attack.presentation.impactMs) {
        attack.impacted = true;
        this.enemyHealth = clamp(this.enemyHealth - attack.damage, 0, this.enemyMaxHealth);
        this.damageDealt += attack.damage;
        this.checkFinish();
      }
      if (attack.elapsed >= attack.presentation.durationMs) this.pendingAttack = null;
      return;
    }
    this.nextAttack -= dt;
    if (this.nextAttack <= 0) {
      const damage = Math.round(
        { easy: 9, normal: 12, hard: 16 }[this.difficulty] * this.opponent.power,
      );
      this.health = clamp(this.health - damage, 0, this.player.health);
      this.effect = {
        serial: this.effect.serial + 1,
        source: "opponent",
        damage,
        effect: this.opponent.abilities[0].effect,
        name: "Counterattack",
        presentation: attackPresentation(this.opponent.abilities[0], this.opponent.id, 85, 40),
      };
      this.nextAttack += this.attackInterval;
    }
    this.checkFinish();
  }
  private checkFinish() {
    if (this.enemyHealth <= 0 || this.health <= 0 || this.elapsed >= 180) {
      this.finished = true;
      this.won = this.enemyHealth <= 0 && this.health > 0;
    }
  }
}
