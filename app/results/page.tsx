"use client";
import Link from "next/link";
import { GameResults } from "@/components/GameResults";
import { usePlayer } from "@/components/PlayerProvider";
export default function Results() {
  const { profile, latestResult, ready } = usePlayer();
  const result =
    latestResult ??
    [...profile.raceHistory, ...profile.battleHistory].sort((a, b) =>
      b.date.localeCompare(a.date),
    )[0];
  if (!ready)
    return (
      <div className="panel" role="status">
        Loading your last result…
      </div>
    );
  return result ? (
    <GameResults result={result} />
  ) : (
    <div className="empty-state panel">
      <h1>Your next achievement awaits.</h1>
      <p>Complete a game to see your results here.</p>
      <Link className="button primary" href="/modes">
        Choose a game
      </Link>
    </div>
  );
}
