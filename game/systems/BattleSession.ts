import { GameSession } from "@/game/systems/GameSession";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { ChallengeDeck } from "@/game/data/challenges";
import type { Ability, Difficulty, Fighter, TypingSnapshot } from "@/game/types/game.types";
import { calculateAccuracy, calculateWpm } from "@/lib/scoring";
import type { AttackPerformance } from "@/game/systems/CombatSystem";

export class BattleSession extends GameSession {
  readonly combat: CombatSystem;
  activeAbility: Ability;
  queuedAbility: Ability | null = null;
  private challenge = 0;
  private awaitingNext = false;
  private deck: ChallengeDeck;
  private baseline: TypingSnapshot;
  private counter: { id: string; ability: Ability; stats: AttackPerformance } | null = null;
  constructor(
    player: Fighter,
    opponent: Fighter,
    private difficulty: Difficulty,
    level = 1,
    seed?: number,
  ) {
    const deck = new ChallengeDeck(seed);
    super("battle", deck.battle(player.id, player.abilities[0], difficulty));
    this.deck = deck;
    this.combat = new CombatSystem(player, opponent, difficulty, level);
    this.activeAbility = player.abilities[0];
    this.baseline = this.engine.snapshot();
    this.cleanup = this.engine.subscribe((event) => {
      if (event.kind === "correct" && event.rewarded) this.combat.charge(0.85);
      if (event.kind === "complete") {
        const attempts = event.snapshot.attempts - this.baseline.attempts;
        const incorrect = event.snapshot.incorrect - this.baseline.incorrect;
        const stats = {
          accuracy: calculateAccuracy(attempts - incorrect, attempts),
          wpm: calculateWpm(
            event.snapshot.correct - this.baseline.correct,
            event.snapshot.elapsed - this.baseline.elapsed,
          ),
          combo: event.snapshot.wordCombo,
        };
        const id = `attack-${this.challenge++}`;
        if (this.combat.pendingAttack?.source === "opponent")
          this.counter = { id, ability: this.activeAbility, stats };
        else this.combat.resolve(id, this.activeAbility, stats);
        this.baseline = event.snapshot;
        this.awaitingNext = true;
      }
    });
  }
  select(ability: Ability): boolean {
    if (this.engine.snapshot().status !== "running" || !this.combat.canUse(ability)) return false;
    if (this.engine.snapshot().position === 0) {
      if (this.activeAbility.id !== ability.id) {
        this.activeAbility = ability;
        this.engine.nextPassage(this.deck.battle(this.combat.player.id, ability, this.difficulty));
        this.baseline = this.engine.snapshot();
      }
    } else this.queuedAbility = ability;
    this.publish();
    return true;
  }
  simulate(seconds: number) {
    this.combat.update(seconds);
    if (!this.combat.finished && !this.combat.pendingAttack && this.counter) {
      const counter = this.counter;
      this.counter = null;
      this.combat.resolve(counter.id, counter.ability, counter.stats);
    }
    if (this.combat.finished) this.finish(this.combat.won, { damage: this.combat.damageDealt });
    else if (this.awaitingNext && !this.combat.pendingAttack) {
      this.awaitingNext = false;
      this.activeAbility =
        this.queuedAbility && this.combat.canUse(this.queuedAbility)
          ? this.queuedAbility
          : this.combat.player.abilities[0];
      this.queuedAbility = null;
      this.engine.nextPassage(
        this.deck.battle(this.combat.player.id, this.activeAbility, this.difficulty),
      );
      this.baseline = this.engine.snapshot();
    }
  }
}
