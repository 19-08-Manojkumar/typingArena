"use client";
import { boxingMoves } from "@/game/data/boxingMoves";
import type { BoxingSession } from "@/game/systems/BoxingSession";
import { Meter } from "@/components/Meter";

export function BoxingControls({ session }: { session: BoxingSession }) {
  const b = session.boxing;
  const running = session.engine.snapshot().status === "running";
  const focus = () => document.getElementById("typing-input")?.focus({ preventScroll: true });
  const hint =
    b.intermission > 0
      ? "Corner break. Breathe and recover stamina."
      : b.defending
        ? `Type the defense now. ${b.guardAccuracy}% accuracy earns a slip counter.`
        : b.counterReady
          ? "Counter ready! Finish the word to slip their jab and fire a rear cross."
          : b.stamina < b.staminaCost
            ? "Low stamina. Finish a word to recover, or let your stamina refill."
            : b.cooldownRemaining > 0
              ? "Returning to guard. Set up your next punch."
              : b.momentum >= 3
                ? "Power ready. Choose an uppercut or flurry, then finish the word to throw it."
                : "Choose a move, then finish the text to throw it. Three clean hits charge your specials.";
  return (
    <div className="boxing-controls">
      <div className="boxing-controls-heading">
        <span>
          {b.defending
            ? "HANDS UP · DEFEND"
            : b.counterReady
              ? "SLIP COUNTER READY"
              : `NEXT: ${boxingMoves.find((move) => move.id === b.nextMove)?.name.toUpperCase()}`}
        </span>
        <div className="boxing-power-meter">
          <Meter
            label={b.counterReady ? "COUNTER READY" : "POWER CHARGE"}
            value={b.counterReady ? 3 : b.momentum}
            max={3}
          />
        </div>
        <button
          type="button"
          disabled={!running || b.defending || b.intermission > 0 || b.counterReady}
          aria-pressed={b.selectedMove === null}
          onClick={() => {
            session.selectMove(null);
            focus();
          }}
        >
          {b.selectedMove === null ? "AUTO COMBO ON" : "USE AUTO COMBO"}
        </button>
      </div>
      <div className="boxing-moves" role="group" aria-label="Boxing moves">
        {boxingMoves.map((move, index) => (
          <button
            key={move.id}
            type="button"
            data-testid={`boxing-move-${move.id}`}
            className={`boxing-move ${b.nextMove === move.id ? "active" : ""} ${move.charge > 0 ? "special" : ""}`}
            disabled={!running || !b.canSelectMove(move.id)}
            aria-pressed={b.selectedMove === move.id}
            aria-keyshortcuts={`Alt+${index + 1} Control+Shift+${index + 1}`}
            title={`${move.cue} · ${b.moveCost(move.id)} stamina. Alt+${index + 1} or Ctrl+Shift+${index + 1}. Finish the text to attack.`}
            onClick={() => {
              session.selectMove(move.id);
              focus();
            }}
          >
            <span>
              <kbd>
                <span className="boxing-key-modifier">Alt+</span>
                {index + 1}
              </kbd>
              {move.name}
            </span>
            <small>
              {move.charge > b.momentum
                ? `CHARGE ${b.momentum}/3`
                : b.stamina < b.moveCost(move.id)
                  ? `NEED ${b.moveCost(move.id)} STAMINA`
                  : move.charge > 0
                    ? "POWER READY"
                    : move.cue}
            </small>
          </button>
        ))}
      </div>
      <p className="boxing-move-hint" role="status">
        {hint}
        <span className="boxing-shortcuts"> Alt+1–5 / Ctrl+Shift+1–5</span>
      </p>
      <p className="boxing-last-hit" aria-live="polite" data-testid="boxing-last-hit">
        {b.effect.name || "Keep your guard high. Make every punch count."}
        {b.effect.damage > 0 ? ` · ${b.effect.damage} damage` : ""}
      </p>
    </div>
  );
}
