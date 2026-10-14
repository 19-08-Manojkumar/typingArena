import { FightScene } from "@/game/scenes/FightScene";
import type { BoxingSession } from "@/game/systems/BoxingSession";
export class CombatScene extends FightScene {
  constructor(
    private match: BoxingSession,
    reducedMotion: boolean,
  ) {
    super("CombatScene", match, 0x84adff, 0xff829c, true, reducedMotion);
  }
  view() {
    const b = this.match.boxing;
    return {
      effect: b.effect,
      playerHealth: b.health,
      enemyHealth: b.enemyHealth,
      finished: b.finished,
      won: b.won,
      warning: b.defending,
    };
  }
}
