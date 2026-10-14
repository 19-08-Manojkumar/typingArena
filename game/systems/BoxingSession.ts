import { GameSession } from "@/game/systems/GameSession";
import { BoxingSystem } from "@/game/systems/BoxingSystem";
import type { Difficulty, TypingSnapshot } from "@/game/types/game.types";
import { calculateAccuracy, calculateWpm } from "@/lib/scoring";
import { ChallengeDeck } from "@/game/data/challenges";
import { boxingOpponents, type BoxingOpponentId } from "@/game/data/boxingOpponents";
export class BoxingSession extends GameSession {
  readonly boxing: BoxingSystem;
  private challenge = 0;
  private deck: ChallengeDeck;
  private baseline: TypingSnapshot;
  constructor(
    difficulty: Difficulty,
    roundDuration: number,
    opponentId: BoxingOpponentId = "mantis",
  ) {
    const deck = new ChallengeDeck();
    super("combat", deck.boxing(boxingOpponents[opponentId].beginner));
    this.deck = deck;
    this.boxing = new BoxingSystem(difficulty, roundDuration, opponentId);
    this.baseline = this.engine.snapshot();
    this.cleanup = this.engine.subscribe((event) => {
      if (event.kind === "incorrect") this.boxing.mistake();
      if (event.kind === "complete") {
        const attempts = event.snapshot.attempts - this.baseline.attempts;
        const incorrect = event.snapshot.incorrect - this.baseline.incorrect;
        this.boxing.resolve(`combo-${this.challenge++}`, {
          accuracy: calculateAccuracy(attempts - incorrect, attempts),
          wpm: calculateWpm(
            event.snapshot.correct - this.baseline.correct,
            event.snapshot.elapsed - this.baseline.elapsed,
          ),
          combo: event.snapshot.wordCombo,
        });
        if (this.boxing.finished)
          this.finish(this.boxing.won, {
            damage: this.boxing.damageDealt,
            rounds: this.boxing.round,
            roundScores: this.boxing.roundScores,
          });
        else this.nextChallenge();
      }
    });
  }
  override key(key: string) {
    if (this.boxing.intermission === 0) super.key(key);
  }
  private nextChallenge() {
    this.baseline = this.engine.snapshot();
    this.engine.nextPassage(
      this.boxing.defending
        ? this.deck.defense(this.boxing.difficulty, this.boxing.opponent.beginner)
        : this.deck.boxing(this.boxing.opponent.beginner),
    );
  }
  simulate(seconds: number) {
    const defending = this.boxing.defending;
    const round = this.boxing.round;
    const resting = this.boxing.intermission > 0;
    this.boxing.update(seconds);
    if (this.boxing.finished)
      this.finish(this.boxing.won, {
        damage: this.boxing.damageDealt,
        rounds: this.boxing.round,
        roundScores: this.boxing.roundScores,
      });
    else if (
      defending !== this.boxing.defending ||
      round !== this.boxing.round ||
      (resting && this.boxing.intermission === 0)
    )
      this.nextChallenge();
  }
}
