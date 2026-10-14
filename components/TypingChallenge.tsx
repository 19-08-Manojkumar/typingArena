"use client";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Keyboard } from "lucide-react";
import type { GameSession } from "@/game/systems/GameSession";
import type { TypingSnapshot } from "@/game/types/game.types";

export function TypingChallenge({
  session,
  snapshot,
  onAction,
  onSound,
  label = "KEEP YOUR RHYTHM. OWN THE MOMENT.",
}: {
  session: GameSession;
  snapshot: TypingSnapshot;
  onAction?: (key: string) => boolean;
  onSound?: (correct: boolean) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const current = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (snapshot.status === "running") input.current?.focus({ preventScroll: true });
  }, [snapshot.status, snapshot.passage]);
  useEffect(() => {
    const node = current.current;
    if (node && node.offsetTop > 60)
      node.parentElement?.scrollTo({ top: node.offsetTop - 35, behavior: "instant" });
    else node?.parentElement?.scrollTo({ top: 0 });
  }, [snapshot.position]);
  const sendKey = (key: string) => {
    if (key.length === 1) onSound?.(key === snapshot.passage[snapshot.position]);
    session.key(key);
  };
  return (
    <section className={`typing-panel ${focused ? "focused" : ""}`} aria-label="Typing challenge">
      <div className="typing-title">
        <span>
          <Keyboard size={15} />
          {label}
        </span>
        <span>
          {snapshot.bestWordCombo > 0 ? `${snapshot.wordCombo} WORD COMBO` : "FIND YOUR FLOW"}
        </span>
      </div>
      <div
        className="passage"
        data-testid="passage"
        onClick={() => input.current?.focus({ preventScroll: true })}
        aria-hidden="true"
      >
        {[...snapshot.passage].map((character, index) => (
          <span
            key={`${snapshot.passage}-${index}`}
            ref={index === snapshot.position ? current : undefined}
            className={`${snapshot.states[index]} ${index === snapshot.position ? "cursor" : ""}`}
          >
            {character}
          </span>
        ))}
      </div>
      <label className="sr-only" htmlFor="typing-input">
        Type the displayed passage
      </label>
      <input
        ref={input}
        id="typing-input"
        data-testid="typing-input"
        className="typing-input"
        aria-describedby="typing-help"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        value=""
        disabled={snapshot.status !== "running"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        onChange={(event) => {
          const value = event.target.value;
          if ([...value].length === 1) sendKey(value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            session.pause();
            return;
          }
          if (
            event.repeat ||
            event.nativeEvent.isComposing ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
          ) {
            if (event.key !== "Tab") event.preventDefault();
            return;
          }
          if (onAction?.(event.key)) {
            event.preventDefault();
            return;
          }
          if (event.key === "Backspace" || event.key.length === 1) {
            event.preventDefault();
            sendKey(event.key);
          }
        }}
      />
      <div className="typing-bottom" id="typing-help">
        <span>
          <Crosshair size={12} />
          {snapshot.status === "running"
            ? focused
              ? "Keyboard connected · type to play"
              : "Click here or press Tab to focus"
            : snapshot.status === "countdown"
              ? "Get ready. The arena is yours."
              : snapshot.status === "complete"
                ? "Attack unleashed · next sentence incoming"
                : "Typing paused"}
        </span>
        <span>
          <kbd>Backspace</kbd> correct <kbd>Esc</kbd> pause
        </span>
      </div>
      <div className="typing-progress" style={{ width: `${snapshot.progress}%` }} />
      <p className="sr-only">{snapshot.passage}</p>
    </section>
  );
}
