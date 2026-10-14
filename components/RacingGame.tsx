"use client";
import { useState } from "react";
import { Flag, Zap } from "lucide-react";
import { vehicles } from "@/game/data/vehicles";
import { RacingSession } from "@/game/systems/RacingSession";
import type { Difficulty, PassageLength, Vehicle } from "@/game/types/game.types";
import { usePlayer } from "@/components/PlayerProvider";
import { VehicleCard } from "@/components/VehicleCard";
import { GameStage } from "@/components/GameStage";
import { Meter } from "@/components/Meter";

export function RacingGame() {
  const { profile, ready } = usePlayer();
  const [vehicle, setVehicle] = useState(vehicles[0]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [distance, setDistance] = useState(1400);
  const [length, setLength] = useState<PassageLength>("medium");
  const [session, setSession] = useState<RacingSession | null>(null);
  const start = (ride: Vehicle) => {
    if (!ready) return;
    session?.dispose();
    setVehicle(ride);
    setSession(
      new RacingSession(ride, distance, difficulty ?? profile.settings.difficulty, length),
    );
  };
  if (session)
    return (
      <GameStage
        session={session}
        title="Typing Racer"
        onReplay={() => start(vehicle)}
        onAction={(key) => {
          if (key === "Enter") {
            session.nitro();
            return true;
          }
          return false;
        }}
        hud={() => (
          <>
            <div className="race-position">
              <span>POSITION</span>
              <strong>
                {session.race.place}
                <small> / 4</small>
              </strong>
              <p>
                {Math.round(session.race.position)} / {distance} m
              </p>
            </div>
            <Meter
              label={session.race.boostRemaining > 0 ? "NITRO ACTIVE" : "NITRO CHARGE"}
              value={session.race.nitro}
              max={100}
            />
            <button
              className="button primary"
              disabled={session.engine.snapshot().status !== "running" || session.race.nitro < 100}
              onClick={() => {
                session.nitro();
                document.getElementById("typing-input")?.focus({ preventScroll: true });
              }}
            >
              <Zap size={17} /> Nitro <kbd>Enter</kbd>
            </button>
            <div className="speed-readout">
              <strong>{Math.round(session.race.speed * 3.6)}</strong>
              <span>KM/H</span>
            </div>
          </>
        )}
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">01 / SPEED + ACCURACY</div>
          <h1>
            Make the streets yours<span className="text-accent">.</span>
          </h1>
          <p>
            Set your race, then click a ride to start. Every correct keystroke fuels your engine.
          </p>
        </div>
        <Flag className="heading-icon" />
      </div>
      <section className="panel race-options">
        <div className="setup-fields">
          <label className="field">
            AI DIFFICULTY
            <select
              value={difficulty ?? profile.settings.difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              <option value="easy">Easy · 26 WPM pace</option>
              <option value="normal">Normal · 42 WPM pace</option>
              <option value="hard">Hard · 62 WPM pace</option>
            </select>
          </label>
          <label className="field">
            RACE DISTANCE
            <select value={distance} onChange={(event) => setDistance(Number(event.target.value))}>
              <option value={800}>Sprint · 800 m</option>
              <option value={1400}>Circuit · 1,400 m</option>
              <option value={2200}>Endurance · 2,200 m</option>
            </select>
          </label>
          <label className="field">
            PASSAGE LENGTH
            <select
              value={length}
              onChange={(event) => setLength(event.target.value as PassageLength)}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </label>
        </div>
      </section>
      <div className="section-heading">
        <h2>Pick a ride. Hit the track.</h2>
        <span className="section-count">CLICK TO RACE</span>
      </div>
      <div className="selection-grid vehicles">
        {vehicles.map((ride) => (
          <VehicleCard
            key={ride.id}
            vehicle={ride}
            selected={false}
            locked={!ready || !profile.unlockedVehicles.includes(ride.id)}
            onSelect={() => start(ride)}
          />
        ))}
      </div>
      <p className="selection-help">
        Mistakes slow you down. Accurate streaks charge nitro. Press Enter to boost when the meter
        is full.
      </p>
    </>
  );
}
