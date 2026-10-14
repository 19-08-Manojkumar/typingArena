"use client";
import { useRef, useState } from "react";
import { ArrowLeft, Swords } from "lucide-react";
import { characters } from "@/game/data/characters";
import { BattleSession } from "@/game/systems/BattleSession";
import type { Difficulty, Fighter } from "@/game/types/game.types";
import { usePlayer } from "@/components/PlayerProvider";
import { CharacterCard } from "@/components/CharacterCard";
import { GameStage } from "@/components/GameStage";
import { Meter } from "@/components/Meter";

export function BattleGame({ collection = false }: { collection?: boolean }) {
  const { profile, ready } = usePlayer();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [session, setSession] = useState<BattleSession | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const start = (opponent: Fighter) => {
    if (!fighter || !ready) return;
    session?.dispose();
    setSession(
      new BattleSession(
        fighter,
        opponent,
        difficulty ?? profile.settings.difficulty,
        profile.level,
      ),
    );
  };
  if (session && fighter)
    return (
      <GameStage
        session={session}
        title="Anime Battle"
        onReplay={() => start(session.combat.opponent)}
        label={() =>
          session.combat.pendingAttack
            ? `${session.activeAbility.name.toUpperCase()} · ${session.combat.effect.presentation?.rating} CAST`
            : `TYPE TO CAST: ${session.activeAbility.name.toUpperCase()}`
        }
        onAction={(key) => {
          const index = ["1", "2", "3", "4", "5"].indexOf(key);
          if (index >= 0) {
            session.select(fighter.abilities[index]);
            return true;
          }
          return false;
        }}
        arenaHud={() => (
          <>
            <div className="arena-player">
              <span className="fighter-side-label">YOU · LEVEL {profile.level}</span>
              <Meter
                label={fighter.name}
                value={session.combat.health}
                max={fighter.health}
                color="green"
              />
              <Meter
                label="SPIRIT"
                value={session.combat.energy}
                max={fighter.energy}
                color="purple"
              />
            </div>
            <div className="arena-center-label">
              <span>MOONLIT SANCTUM</span>
              <strong>VS</strong>
            </div>
            <div className="arena-opponent">
              <span className="fighter-side-label">
                RIVAL · {session.combat.difficulty.toUpperCase()}
              </span>
              <Meter
                label={session.combat.opponent.name}
                value={session.combat.enemyHealth}
                max={session.combat.enemyMaxHealth}
                color="red"
              />
              <Meter
                label="NEXT STRIKE"
                value={session.combat.attackInterval - session.combat.nextAttack}
                max={Math.ceil(session.combat.attackInterval)}
                color="red"
              />
            </div>
          </>
        )}
        hud={() => (
          <div className="battle-actions">
            <div className="ability-buttons">
              {fighter.abilities.map((ability, index) => (
                <button
                  key={ability.id}
                  aria-keyshortcuts={`Alt+${index + 1} Control+Shift+${index + 1}`}
                  title={`Alt + ${index + 1} or Ctrl + Shift + ${index + 1} · ${ability.damage} base damage`}
                  className={`ability-button ${session.activeAbility.id === ability.id ? "active" : ""} ${session.queuedAbility?.id === ability.id ? "queued" : ""}`}
                  disabled={
                    session.engine.snapshot().status !== "running" ||
                    !session.combat.canUse(ability)
                  }
                  onClick={() => {
                    session.select(ability);
                    document.getElementById("typing-input")?.focus({ preventScroll: true });
                  }}
                >
                  <span>
                    <kbd>Alt+{index + 1}</kbd> {ability.name}
                  </span>
                  <small>
                    {session.queuedAbility?.id === ability.id
                      ? "QUEUED NEXT"
                      : session.combat.cooldown(ability) > 0
                        ? `${session.combat.cooldown(ability).toFixed(1)}s cooldown`
                        : `${ability.tier === "finisher" ? "SUPREME" : ability.tier.toUpperCase()} · ${ability.cost} SPIRIT`}
                  </small>
                </button>
              ))}
            </div>
            <p className="hud-hint" role="status">
              {session.combat.pendingAttack
                ? `${session.activeAbility.name} unleashed. Watch your attack land.`
                : session.queuedAbility
                  ? `${session.queuedAbility.name} is next. Finish this sentence.`
                  : "Alt + 1–5 or Ctrl + Shift + 1–5 to choose. Finish the sentence to unleash."}
            </p>
          </div>
        )}
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">02 / POWER + PRECISION</div>
          <h1>
            {collection ? "Meet your next legend" : "Awaken your potential"}
            <span className="text-accent">.</span>
          </h1>
          <p>
            {fighter
              ? "Choose your rival to begin. The countdown starts when you click their card."
              : "Click a fighter to choose them. Every ability has a new typing challenge."}
          </p>
        </div>
        <Swords className="heading-icon" />
      </div>
      <div className="selection-stepbar">
        <div className="selection-steps">
          <span className={!fighter ? "current" : "done"}>01 YOUR FIGHTER</span>
          <span className={fighter ? "current" : ""}>02 YOUR RIVAL</span>
        </div>
        <label className="field compact-field">
          OPPONENT DIFFICULTY
          <select
            value={difficulty ?? profile.settings.difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
      <div className="section-heading">
        <h2 ref={stepHeading} tabIndex={-1}>
          {fighter ? `Choose your opponent for ${fighter.name}` : "Choose your fighter"}
        </h2>
        {fighter && (
          <button className="text-link" onClick={() => setFighter(null)}>
            <ArrowLeft size={14} /> Change fighter
          </button>
        )}
      </div>
      <div className="selection-grid" key={fighter ? "opponents" : "fighters"}>
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            fighter={character}
            selected={false}
            locked={!ready || !profile.unlockedCharacters.includes(character.id)}
            actionLabel={fighter ? "Battle this rival" : "Choose this fighter"}
            onSelect={() => {
              if (fighter) start(character);
              else {
                setFighter(character);
                requestAnimationFrame(() => stepHeading.current?.focus({ preventScroll: true }));
              }
            }}
          />
        ))}
      </div>
      <p className="selection-help">
        {fighter
          ? "Each rival has a different pace and power. Click a card to enter the arena."
          : "Precision charges spirit. Specials create unique effects. Ultimate attacks change the battlefield."}
      </p>
    </>
  );
}
