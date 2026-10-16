"use client";
import { useId } from "react";
import type { TypingSnapshot } from "@/game/types/game.types";

function StartFlag({ side }: { side: "left" | "right" }) {
  const id = useId();
  return (
    <svg className={`race-start-flag ${side}`} viewBox="0 0 88 105" aria-hidden="true">
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#eaf6ff" />
          <path d="M0 0H8V8H0ZM8 8H16V16H8Z" fill="#13243a" />
        </pattern>
      </defs>
      <g transform={side === "right" ? "translate(88 0) scale(-1 1)" : undefined}>
        <path d="M15 8V99" stroke="#b6cde2" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M17 12C35 2 50 22 75 12V59C51 69 36 49 17 59Z"
          fill={`url(#${id})`}
          stroke="#cbefff"
          strokeWidth="1.5"
        />
        <circle cx="15" cy="7" r="3.5" fill="#dff8ff" />
      </g>
    </svg>
  );
}

/** The game clock drives both the lights and GO cue, including pause and replay. */
export function RaceStartSignal({
  snapshot,
  reducedMotion,
}: {
  snapshot: TypingSnapshot;
  reducedMotion: boolean;
}) {
  const countdown = snapshot.status === "countdown";
  const go = snapshot.status === "running" && snapshot.elapsed < 1000;
  if (!countdown && !go) return null;
  const lit = Math.max(1, Math.min(3, 4 - snapshot.countdown));
  return (
    <div
      className="race-start-signal"
      data-testid="race-start-signal"
      data-phase={go ? "go" : "countdown"}
      data-reduced={reducedMotion}
    >
      <div className="race-start-content">
        <StartFlag side="left" />
        <div className="race-start-panel" role="status" aria-live="polite" aria-atomic="true">
          <span className="race-start-eyebrow">{go ? "LIGHTS OUT" : "STARTING GRID"}</span>
          <div
            className="race-start-lights"
            role="img"
            aria-label={
              go ? "Green lights. Go!" : `${lit} red ${lit === 1 ? "light" : "lights"}. Get ready.`
            }
          >
            {[0, 1, 2].map((light) => (
              <span key={light} className="race-start-lamp" data-on={go || light < lit} />
            ))}
          </div>
          <strong className="race-start-count" data-testid="race-start-count">
            {go ? "GO!" : snapshot.countdown}
          </strong>
          <span className="race-start-instruction">
            {go ? "TYPE TO ACCELERATE" : "Engines ready. Hold your line."}
          </span>
        </div>
        <StartFlag side="right" />
      </div>
    </div>
  );
}
