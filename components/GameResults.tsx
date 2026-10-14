"use client";
import Link from "next/link";
import { ArrowRight, Medal, RotateCcw, Trophy } from "lucide-react";
import type { GameResult } from "@/game/types/game.types";
import { usePlayer } from "@/components/PlayerProvider";
export function GameResults({ result, onReplay }: { result: GameResult; onReplay?: () => void }) {
  const { profile } = usePlayer();
  const stats = [
    ["FINAL SPEED", `${Math.round(result.wpm)} WPM`],
    ["ACCURACY", `${result.accuracy.toFixed(1)}%`],
    ["CORRECT CHARACTERS", result.correct],
    ["INCORRECT ATTEMPTS", result.incorrect],
    ["BEST WORD COMBO", `${result.bestWordCombo}×`],
    ["BEST STREAK", result.bestStreak],
    ["ACTIVE TIME", `${(result.duration / 1000).toFixed(1)}s`],
    [
      result.mode === "racing" ? "RACE POSITION" : "DAMAGE DEALT",
      result.mode === "racing" ? `${result.position} / 4` : (result.damage ?? 0),
    ],
  ];
  return (
    <section
      className={`results-panel panel ${result.won ? "victory" : "defeat"}`}
      aria-label="Game results"
    >
      <div className="result-emblem">{result.won ? <Trophy size={40} /> : <Medal size={40} />}</div>
      <div className="eyebrow">
        {result.mode === "racing"
          ? "RACE COMPLETE"
          : result.mode === "battle"
            ? "MATCH COMPLETE"
            : "FINAL SCORECARD"}
      </div>
      <h1>{result.won ? "Victory looks good on you." : "A setback. A stronger comeback."}</h1>
      <p>
        {result.won
          ? "You found your rhythm and made every keystroke count."
          : "Every round is practice. Take a breath, reset, and go again."}
      </p>
      <div className="results-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {result.roundScores && (
        <div className="round-scorecards results-rounds">
          {result.roundScores.map((score) => (
            <span key={score.round}>
              ROUND {score.round} · {score.won ? "WON" : "LOST / TIED"} · {score.dealt} dealt /{" "}
              {score.taken} taken
            </span>
          ))}
        </div>
      )}
      <div className="xp-award">
        <span>+{result.xp} XP EARNED</span>
        <strong>LEVEL {profile.level}</strong>
        <span>{profile.xp} total XP</span>
      </div>
      <div className="button-row">
        {onReplay ? (
          <button className="button primary" onClick={onReplay}>
            <RotateCcw size={17} /> Play again
          </button>
        ) : (
          <Link className="button primary" href={`/${result.mode}`}>
            Play again <ArrowRight size={17} />
          </Link>
        )}
        <Link className="button secondary" href="/">
          Return to menu
        </Link>
        <Link className="text-link" href="/records">
          View records <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
