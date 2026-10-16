import type { RacingSystem } from "@/game/systems/RacingSystem";
import type { TypingStatus } from "@/game/types/game.types";
import { clamp } from "@/lib/scoring";

/** Expand the world horizontally to fill the panel while preserving car proportions. */
export function raceViewportSize(panelWidth: number, panelHeight: number) {
  return {
    width:
      panelHeight > 0
        ? Math.max(360, Math.ceil((panelWidth * 410) / panelHeight))
        : panelWidth < 600
          ? 600
          : 960,
    height: 410,
  };
}

export function raceCamera(width: number, position: number, distance: number) {
  const anchor = clamp(width * 0.25, 100, 225);
  const pixelsPerMeter = width < 800 ? 2.4 : 3.2;
  return {
    anchor,
    pixelsPerMeter,
    finishX: anchor + Math.max(0, distance - position) * pixelsPerMeter,
    carX: (rivalPosition: number) =>
      clamp(anchor + (rivalPosition - position) * pixelsPerMeter, 60, width - 68),
  };
}

export function raceFeedback(race: RacingSystem, status: TypingStatus) {
  if (race.finished)
    return { label: race.place === 1 ? "VICTORY LAP" : "RACE COMPLETE", tone: "finish" };
  if (status === "countdown") return { label: "TYPE TO ACCELERATE", tone: "idle" };
  if (status === "paused") return { label: "RACE PAUSED", tone: "idle" };
  if (race.boostRemaining > 0) return { label: "NITRO ENGAGED", tone: "boost" };
  if (race.elapsed - race.lastMistakeAt < 0.8)
    return { label: "RECOVER YOUR RHYTHM", tone: "error" };
  if (race.nitro >= 100)
    return {
      label: race.speed < 1 ? "TYPE TO LAUNCH NITRO" : "NITRO READY · PRESS ENTER",
      tone: "ready",
    };
  if (race.speed < 1 || race.elapsed - race.lastInputAt > 2)
    return { label: "KEEP TYPING TO BUILD SPEED", tone: "idle" };
  return { label: "CLEAN KEYS. MORE SPEED.", tone: "pace" };
}

export function raceGap(race: RacingSystem) {
  const ahead = race.opponents
    .filter((rival) => rival.position > race.position)
    .sort((a, b) => a.position - b.position)[0];
  if (ahead) return `${Math.ceil(ahead.position - race.position)} m to ${ahead.name}`;
  const closest = Math.max(...race.opponents.map((rival) => rival.position));
  return race.position > closest
    ? `Leading by ${Math.floor(race.position - closest)} m`
    : "Stay on the throttle";
}
