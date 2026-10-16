import { Zap } from "lucide-react";
import type { RacingSession } from "@/game/systems/RacingSession";
import { raceFeedback, raceGap } from "@/game/systems/RacingPresentation";

export function RacingHud({ session }: { session: RacingSession }) {
  const race = session.race;
  const status = session.engine.snapshot().status;
  const boosted = race.boostRemaining > 0;
  const feedback = raceFeedback(race, status);
  const ready = status === "running" && race.canActivateNitro;
  const progress = Math.min(100, (race.position / race.distance) * 100);
  const nitroValue = boosted ? race.boostRemaining : race.nitro;
  const nitroMax = boosted ? race.boostDuration : 100;
  const nitroLabel = boosted ? "NITRO ACTIVE" : "NITRO CHARGE";
  return (
    <div className="racing-dashboard" data-tone={feedback.tone}>
      <div className="racing-standing">
        <span>POSITION</span>
        <strong>
          {race.place}
          <small> / 4</small>
        </strong>
        <span className="racing-gap">{raceGap(race)}</span>
      </div>
      <div className="racing-nitro">
        <div className="racing-nitro-controls">
          <div className="racing-nitro-meter">
            <div>
              <span>{nitroLabel}</span>
              <strong>
                {boosted ? `${race.boostRemaining.toFixed(1)}s` : `${Math.floor(race.nitro)}%`}
              </strong>
            </div>
            <div
              className="resource-track"
              role="progressbar"
              aria-label={nitroLabel}
              aria-valuenow={Number(nitroValue.toFixed(1))}
              aria-valuemin={0}
              aria-valuemax={nitroMax}
            >
              <span style={{ width: `${Math.min(100, (nitroValue / nitroMax) * 100)}%` }} />
            </div>
          </div>
          <button
            className={`button primary racing-boost ${ready ? "ready" : ""}`}
            aria-label="Nitro Enter"
            data-testid="nitro-button"
            disabled={!ready}
            onClick={() => {
              session.nitro();
              document.getElementById("typing-input")?.focus({ preventScroll: true });
            }}
          >
            <Zap size={16} /> Nitro <kbd>Enter</kbd>
          </button>
        </div>
        <span className="racing-feedback" role="status">
          {feedback.label}
        </span>
      </div>
      <div className="racing-speed">
        <span>SPEED</span>
        <strong data-testid="race-speed">{Math.round(race.speed * 3.6)}</strong>
        <span>KM/H</span>
      </div>
      <div className="racing-distance">
        <span>
          {Math.round(race.position).toLocaleString()} / {race.distance.toLocaleString()} m
        </span>
        <div
          className="racing-distance-track"
          role="progressbar"
          aria-label="Race progress"
          aria-valuemin={0}
          aria-valuemax={race.distance}
          aria-valuenow={Math.round(race.position)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <span>{Math.max(0, Math.ceil(race.distance - race.position))} m left</span>
      </div>
    </div>
  );
}
