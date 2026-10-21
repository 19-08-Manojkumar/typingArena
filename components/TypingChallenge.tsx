"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const passage = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (snapshot.status === "running") input.current?.focus({ preventScroll: true });
  }, [snapshot.status, snapshot.passage]);
  const followCurrentLine = useCallback(() => {
    const viewport = passage.current;
    // Completion has no next character; leave the final line visible until the next passage.
    const cursor = current.current ?? viewport?.querySelector<HTMLSpanElement>("span:last-child");
    if (!viewport || !cursor || !viewport.clientHeight) return;
    const bounds = viewport.getBoundingClientRect();
    const character = cursor.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(viewport).lineHeight) || character.height;
    if (!lineHeight) return;
    const contentTop = character.top - bounds.top - viewport.clientTop + viewport.scrollTop;
    const lineTop = Math.max(
      0,
      Math.floor((contentTop + character.height / 2) / lineHeight) * lineHeight,
    );
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const target = Math.max(
      0,
      Math.min(maxScroll, lineTop - (viewport.clientHeight - lineHeight) / 2),
    );
    // Update before paint, and scroll only this panel. Fast typing never waits for a scroll animation.
    viewport.style.setProperty("--typing-line-top", `${lineTop}px`);
    viewport.style.setProperty("--typing-line-height", `${lineHeight}px`);
    if (Math.abs(viewport.scrollTop - target) > 0.5)
      viewport.scrollTo({ top: target, behavior: "instant" });
  }, []);
  useLayoutEffect(() => {
    followCurrentLine();
  }, [snapshot.position, snapshot.passage, snapshot.status, focused, followCurrentLine]);
  useEffect(() => {
    const viewport = passage.current;
    if (!viewport) return;
    const observer = new ResizeObserver(followCurrentLine);
    observer.observe(viewport);
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) followCurrentLine();
    });
    document.fonts.addEventListener("loadingdone", followCurrentLine);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", followCurrentLine);
    };
  }, [followCurrentLine]);
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
        ref={passage}
        className="passage"
        data-testid="passage"
        onClick={() => {
          input.current?.focus({ preventScroll: true });
          followCurrentLine();
        }}
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
