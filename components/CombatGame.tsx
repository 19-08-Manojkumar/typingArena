"use client";
import { useState } from "react";
import { Shield, Timer, Zap } from "lucide-react";
import { ArenaArt } from "@/components/ArenaArt";
import { usePlayer } from "@/components/PlayerProvider";
import { BoxingSession } from "@/game/systems/BoxingSession";
import type { Difficulty } from "@/game/types/game.types";
import { GameStage } from "@/components/GameStage";
import { Meter } from "@/components/Meter";
export function CombatGame() {
  const { profile, ready } = usePlayer();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [roundDuration, setRoundDuration] = useState(35);
  const [session, setSession] = useState<BoxingSession | null>(null);
  const start = (duration = roundDuration) => {
    session?.dispose();
    setRoundDuration(duration);
    setSession(new BoxingSession(difficulty ?? profile.settings.difficulty, duration));
  };
  if (session)
    return (
      <GameStage
        session={session}
        title="Combat Arena"
        onReplay={() => start()}
        label={() =>
          session.boxing.intermission > 0
            ? "BREATHE. NEXT ROUND STARTS SOON."
            : session.boxing.defending
              ? `DEFEND NOW · ${session.boxing.defenseRemaining.toFixed(1)}s TO BLOCK`
              : `COMBINATION · ${session.boxing.multiplier.toFixed(1)}× DAMAGE`
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
              <Meter label="Iron Mantis" value={session.boxing.enemyHealth} max={150} color="red" />
              <span className="rival-intent">
                {session.boxing.defending ? "COMBO INCOMING" : "LOOKING FOR AN OPENING"}
              </span>
            </div>
          </>
        )}
        hud={() => (
          <div className="battle-hud">
            <div className="round-banner">
              <span>ROUND {session.boxing.round} / 3</span>
              <strong>
                {session.boxing.intermission > 0
                  ? `Next round in ${Math.ceil(session.boxing.intermission)}s`
                  : `${Math.ceil(session.boxing.remaining)}s`}
              </strong>
              <span>
                {session.boxing.defending ? "DEFENSE CHALLENGE" : "LAND YOUR COMBINATION"}
              </span>
            </div>
            <p className="hud-hint">
              {session.boxing.intermission > 0
                ? "Corner break. Stamina recovers; typing resumes next round."
                : session.boxing.defending
                  ? "Type the defense before the timer ends. At least 80% accuracy blocks all damage."
                  : session.boxing.stamina < 18
                    ? "Low stamina. Your next completed combo helps you recover."
                    : "Complete a punch combination to attack. Watch for the defense challenge."}
            </p>
            {session.boxing.effect.name && (
              <p className="combat-feedback" role="status">
                {session.boxing.effect.name}
                {session.boxing.effect.damage > 0
                  ? ` · ${session.boxing.effect.damage} damage`
                  : ""}
              </p>
            )}
            {session.boxing.roundScores.length > 0 && (
              <div className="round-scorecards">
                {session.boxing.roundScores.map((score) => (
                  <span key={score.round}>
                    R{score.round} · {score.won ? "WON" : "LOST / TIED"} · {score.dealt} dealt /{" "}
                    {score.taken} taken
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
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
            Face Iron Mantis in three rounds of keyboard boxing. Type combinations to punch, and
            react to incoming attacks with a timed defense.
          </p>
          <div className="boxing-features">
            <span>
              <Zap size={16} /> Build a 1.5× combo
            </span>
            <span>
              <Shield size={16} /> Type to block
            </span>
            <span>
              <Timer size={16} /> Win by KO or rounds
            </span>
          </div>
        </div>
        <ArenaArt mode="combat" color="#f38aab" />
      </section>
      <section className="panel setup-panel">
        <div className="setup-fields">
          <label className="field">
            OPPONENT DIFFICULTY
            <select
              value={difficulty ?? profile.settings.difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              <option value="easy">Easy · 4.5s defense window</option>
              <option value="normal">Normal · 4s defense window</option>
              <option value="hard">Hard · 3.5s defense window</option>
            </select>
          </label>
        </div>
        <div className="setup-bottom">
          <p>
            <strong>Stay composed under pressure.</strong> Punches cost 18 stamina. Defense restores
            it. Win two rounds on damage, or finish with a knockout. Tied rounds go to your
            opponent.
          </p>
        </div>
        <div className="quick-start-grid">
          {[
            { name: "Quick bout", duration: 25 },
            { name: "Standard bout", duration: 35 },
            { name: "Extended bout", duration: 50 },
          ].map((bout) => (
            <button
              key={bout.duration}
              disabled={!ready}
              className="quick-start-card"
              onClick={() => start(bout.duration)}
            >
              <span>3 ROUNDS · {bout.duration}s EACH</span>
              <strong>{bout.name}</strong>
              <span>Enter the ring →</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
