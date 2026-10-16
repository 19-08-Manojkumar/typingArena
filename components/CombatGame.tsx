"use client";
import { useState } from "react";
import { Shield, Timer, Zap } from "lucide-react";
import { ArenaArt } from "@/components/ArenaArt";
import { usePlayer } from "@/components/PlayerProvider";
import { BoxingSession } from "@/game/systems/BoxingSession";
import type { Difficulty } from "@/game/types/game.types";
import { GameStage } from "@/components/GameStage";
import { Meter } from "@/components/Meter";
import { boxingOpponents, type BoxingOpponentId } from "@/game/data/boxingOpponents";
import { BoxingControls } from "@/components/BoxingControls";
import { boxingMoves } from "@/game/data/boxingMoves";
export function CombatGame() {
  const { profile, ready } = usePlayer();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [opponent, setOpponent] = useState<BoxingOpponentId>("practice");
  const [roundDuration, setRoundDuration] = useState(35);
  const [session, setSession] = useState<BoxingSession | null>(null);
  const start = (duration = roundDuration, bot = opponent, level = difficulty) => {
    session?.dispose();
    setRoundDuration(duration);
    setSession(new BoxingSession(level, duration, bot));
  };
  if (session)
    return (
      <GameStage
        session={session}
        title="Combat Arena"
        onAction={(key) => {
          const index = ["1", "2", "3", "4", "5"].indexOf(key);
          if (index < 0) return false;
          session.selectMove(boxingMoves[index].id);
          return true;
        }}
        onReplay={() => start(roundDuration, session.boxing.opponent.id, session.boxing.difficulty)}
        label={() =>
          session.boxing.intermission > 0
            ? "BREATHE. NEXT ROUND STARTS SOON."
            : session.boxing.defending
              ? `DEFEND NOW · ${session.boxing.defenseRemaining.toFixed(1)}s TO BLOCK`
              : `${session.boxing.nextMove.toUpperCase()} · ${session.boxing.multiplier.toFixed(1)}× COMBO`
        }
        arenaHud={() => (
          <>
            <div className="arena-player">
              <span className="fighter-side-label">YOUR CORNER</span>
              <Meter
                label={profile.displayName}
                value={session.boxing.health}
                max={150}
                color="green"
              />
              <Meter label="STAMINA" value={session.boxing.stamina} max={100} color="blue" />
            </div>
            <div className="arena-center-label">
              <span>ROUND {session.boxing.round} / 3</span>
              <strong>{Math.ceil(session.boxing.remaining)}s</strong>
            </div>
            <div className="arena-opponent">
              <span className="fighter-side-label">OPPONENT</span>
              <Meter
                label={session.boxing.opponent.name}
                value={session.boxing.enemyHealth}
                max={session.boxing.opponent.health}
                color="red"
              />
              <span className="rival-intent">
                {session.boxing.opponent.id === "practice"
                  ? "PRACTICE PARTNER · NO ATTACKS"
                  : session.boxing.defending
                    ? "COMBO INCOMING"
                    : "LOOKING FOR AN OPENING"}
              </span>
            </div>
          </>
        )}
        hud={() => <BoxingControls session={session} />}
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">03 / RHYTHM + REACTION</div>
          <h1>
            Earn your corner<span className="text-accent">.</span>
          </h1>
          <p>The bell is about to ring. Bring your rhythm and leave everything in the arena.</p>
        </div>
        <Shield className="heading-icon" />
      </div>
      <section className="boxing-intro panel">
        <div>
          <span className="pill">THE UNDERGROUND · BOXING</span>
          <h2>
            Fast hands.
            <br />
            Sharper instincts.
          </h2>
          <p>
            Start with a friendly practice partner or challenge Iron Mantis in three rounds of
            keyboard boxing. Choose a jab, one-two, or body hook and finish the text to throw it.
            Three clean hits charge a power uppercut or ringside flurry. Read incoming attacks, type
            the defense, then slip their jab and land a counter.
          </p>
          <div className="boxing-features">
            <span>
              <Zap size={16} /> Uppercuts + flurries
            </span>
            <span>
              <Shield size={16} /> Block and counter
            </span>
            <span>
              <Timer size={16} /> Win by KO or rounds
            </span>
          </div>
        </div>
        <ArenaArt mode="combat" color="#f38aab" />
      </section>
      <section className="panel setup-panel">
        <h2>Choose your sparring partner</h2>
        <p className="hud-hint">
          New to typing? Start with Practice Pal. Move up to Rookie Ray when you feel ready.
        </p>
        <div className="quick-start-grid" role="group" aria-label="Boxing opponents">
          {Object.values(boxingOpponents).map((bot) => (
            <button
              key={bot.id}
              type="button"
              className="quick-start-card"
              aria-pressed={opponent === bot.id}
              onClick={() => {
                setOpponent(bot.id);
                if (bot.beginner) setDifficulty("easy");
              }}
            >
              <span>
                {opponent === bot.id ? "SELECTED" : "SELECT OPPONENT"} · {bot.health} HP
              </span>
              <strong>{bot.name}</strong>
              <span>{bot.description}</span>
            </button>
          ))}
        </div>
        <div className="setup-fields">
          <label className="field">
            OPPONENT DIFFICULTY
            <select
              value={difficulty}
              disabled={boxingOpponents[opponent].beginner}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              <option value="easy">
                {opponent === "practice"
                  ? "Practice · no attacks"
                  : opponent === "rookie"
                    ? "Beginner · 10s defense window"
                    : "Easy · 7s defense window"}
              </option>
              <option value="normal">Normal · 4s defense window</option>
              <option value="hard">Hard · 3.5s defense window</option>
            </select>
          </label>
        </div>
        <div className="setup-bottom">
          <p>
            {opponent === "practice"
              ? "Practice Pal never attacks. Type short, single words and learn at your own pace. Punches cost only 10 stamina."
              : opponent === "rookie"
                ? "Rookie Ray gives you 14 seconds between attacks and 10 seconds to type a short defense. Missed blocks cost just 4 health. Punches cost 10 stamina."
                : "Iron Mantis follows the selected difficulty. Punches cost 18 stamina. Easy gives you 7 seconds to block and lighter incoming damage."}{" "}
            Win two rounds on damage, or finish with a knockout. Tied rounds go to your opponent.
          </p>
        </div>
        <div className="quick-start-grid">
          {[
            {
              name: "Quick bout",
              duration: 25,
              description: "Beginner preset · Rookie Ray · single words",
            },
            {
              name: "Standard bout",
              duration: 35,
              description: `Play against ${boxingOpponents[opponent].name}`,
            },
            {
              name: "Extended bout",
              duration: 50,
              description: `More practice time with ${boxingOpponents[opponent].name}`,
            },
          ].map((bout) => (
            <button
              key={bout.duration}
              disabled={!ready}
              className="quick-start-card"
              onClick={() =>
                bout.duration === 25 ? start(25, "rookie", "easy") : start(bout.duration)
              }
            >
              <span>3 ROUNDS · {bout.duration}s EACH</span>
              <strong>{bout.name}</strong>
              <span>{bout.description} →</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
