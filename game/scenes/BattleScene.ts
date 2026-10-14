import * as Phaser from "phaser";
import { FightScene } from "@/game/scenes/FightScene";
import type { BattleSession } from "@/game/systems/BattleSession";
export class BattleScene extends FightScene {
  constructor(
    private battle: BattleSession,
    reducedMotion: boolean,
  ) {
    super(
      "BattleScene",
      battle,
      Phaser.Display.Color.HexStringToColor(battle.combat.player.color).color,
      Phaser.Display.Color.HexStringToColor(battle.combat.opponent.color).color,
      false,
      reducedMotion,
      battle.combat.player.id,
      battle.combat.opponent.id,
    );
  }
  view() {
    const c = this.battle.combat;
    return {
      effect: c.effect,
      playerHealth: c.health,
      enemyHealth: c.enemyHealth,
      finished: c.finished,
      won: c.won,
      warning: c.nextAttack < 1.5,
    };
  }
}
