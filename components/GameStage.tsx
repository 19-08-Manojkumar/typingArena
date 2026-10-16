"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import { GameCanvas } from "@/components/GameCanvas";
import { GameResults } from "@/components/GameResults";
import { TypingChallenge } from "@/components/TypingChallenge";
import type { GameSession } from "@/game/systems/GameSession";
import type { TypingSnapshot } from "@/game/types/game.types";
import { GameAudio } from "@/lib/audio";
import { abilityShortcut } from "@/lib/shortcuts";
import { RaceStartSignal } from "@/components/RaceStartSignal";

interface GameStageProps {
  session: GameSession;
  title: string;
  onReplay: () => void;
  hud: (snapshot: TypingSnapshot) => React.ReactNode;
  arenaHud?: () => React.ReactNode;
  onAction?: (key: string) => boolean;
  label?: string | (() => string);
}
export function GameStage({
  session,
  title,
  onReplay,
  hud,
  arenaHud,
  onAction,
  label,
}: GameStageProps) {
  useSyncExternalStore(session.subscribe, session.getRevision, session.getRevision);
  const snapshot = session.engine.snapshot();
  const { profile, record } = usePlayer();
  const stage = useRef<HTMLDivElement>(null);
  const recorded = useRef<string | null>(null);
  const sound = useRef<GameAudio | null>(null);
  const [presentedResult, setPresentedResult] = useState<string | null>(null);
  useEffect(() => {
    sound.current = new GameAudio(profile.settings.sound, profile.settings.volume);
    return () => {
      sound.current?.dispose();
      sound.current = null;
    };
  }, [profile.settings.sound, profile.settings.volume]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () =>
      stage.current?.style.setProperty(
        "--arena-viewport",
        `${viewport?.height ?? window.innerHeight}px`,
      );
    resize();
    window.scrollTo({ top: 0, behavior: "instant" });
    viewport?.addEventListener("resize", resize);
    return () => viewport?.removeEventListener("resize", resize);
  }, [session]);
  useEffect(() => {
    if (session.result && recorded.current !== session.result.id) {
      recorded.current = session.result.id;
      record(session.result);
      sound.current?.play(session.result.won ? "win" : "lose");
    }
  }, [session.result, record]);
  useEffect(() => {
    if (!session.result) return;
    const id = session.result.id;
    const timer = setTimeout(() => setPresentedResult(id), session.mode === "combat" ? 1600 : 1100);
    return () => clearTimeout(timer);
  }, [session.result, session.mode]);
  if (session.result && presentedResult === session.result.id)
    return <GameResults result={session.result} onReplay={onReplay} />;
  return (
    <div
      ref={stage}
      className={`game-stage ${session.mode}-stage`}
      onPointerDown={() => sound.current?.unlock()}
      onKeyDown={() => sound.current?.unlock()}
      onKeyDownCapture={(event) => {
        const digit = abilityShortcut(event);
        if (digit !== null && onAction?.(String(digit))) {
          event.preventDefault();
          event.stopPropagation();
          document.getElementById("typing-input")?.focus({ preventScroll: true });
        }
      }}
    >
      <div className="game-toolbar">
        <div className="game-title">
          <Link href="/modes" className="icon-button" aria-label="Leave game">
            <ArrowLeft size={16} />
          </Link>
          <h1>{title}</h1>
        </div>
        <div className="live-stats" aria-label="Live typing statistics">
          <div>
            <strong>{Math.round(snapshot.wpm)}</strong>
            <span>WPM</span>
          </div>
          <div>
            <strong>{snapshot.accuracy.toFixed(0)}%</strong>
            <span>ACCURACY</span>
          </div>
          <div>
            <strong>{snapshot.streak}</strong>
            <span>STREAK</span>
          </div>
          <div>
            <strong>{Math.floor(snapshot.elapsed / 1000)}s</strong>
            <span>TIME</span>
          </div>
        </div>
        <div className="button-row">
          <button className="icon-button" onClick={() => session.pause()} aria-label="Pause game">
            <Pause size={16} />
          </button>
          <button className="icon-button" onClick={onReplay} aria-label="Restart game">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="stage-visual">
        <GameCanvas session={session} reducedMotion={profile.settings.reducedMotion} />
        {arenaHud && <div className="arena-hud">{arenaHud()}</div>}
        {session.mode === "racing" && (
          <RaceStartSignal snapshot={snapshot} reducedMotion={profile.settings.reducedMotion} />
        )}
        {snapshot.status === "countdown" && session.mode !== "racing" && (
          <div className="stage-overlay countdown" role="status">
            <span>READY TO MAKE YOUR MOVE?</span>
            <strong>{snapshot.countdown}</strong>
            <p>Get your fingers on the keys.</p>
          </div>
        )}
        {snapshot.status === "paused" && (
          <div
            className="stage-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Game paused"
            onKeyDown={(event) => {
              if (event.key === "Tab") event.preventDefault();
              if (event.key === "Escape") {
                event.preventDefault();
                session.resume();
              }
            }}
          >
            <div className="pause-card">
              <span className="eyebrow">TAKE A BREATH</span>
              <h2>Time is on your side.</h2>
              <button autoFocus className="button primary" onClick={() => session.resume()}>
                <Play size={16} /> Resume game
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="game-hud">{hud(snapshot)}</div>
      <TypingChallenge
        session={session}
        snapshot={snapshot}
        onAction={onAction}
        onSound={(correct) => sound.current?.play(correct ? "correct" : "error")}
        label={typeof label === "function" ? label() : label}
      />
      <p className="rules-note">
        {session.mode === "racing"
          ? "Type to accelerate. Clean streaks charge nitro. Enter boosts when ready. Escape pauses the race."
          : session.mode === "combat"
            ? "Finish the text to punch. Click a move or use Alt+1–5 / Ctrl+Shift+1–5. Clean hits charge specials. Escape pauses."
            : "Correct keys build power. Backspace fixes text; earlier mistakes still count. Escape pauses the game."}
      </p>
    </div>
  );
}
