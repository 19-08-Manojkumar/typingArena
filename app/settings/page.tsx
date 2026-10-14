"use client";
import { useState } from "react";
import { RotateCcw, Save, Settings2 } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Difficulty } from "@/game/types/game.types";

export default function Settings() {
  const { profile, ready, update, reset } = usePlayer();
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h1>
            Arena settings<span className="text-accent">.</span>
          </h1>
          <p>Your setup. Your pace. Your way to play.</p>
        </div>
        <Settings2 className="heading-icon" />
      </div>
      {ready && (
        <form
          key={JSON.stringify([profile.displayName, profile.settings])}
          className="panel settings-panel"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            update({
              ...profile,
              displayName: String(data.get("displayName") || "Challenger"),
              settings: {
                sound: data.get("sound") === "on",
                volume: Number(data.get("volume")),
                difficulty: data.get("difficulty") as Difficulty,
                reducedMotion: data.get("reducedMotion") === "on",
              },
            });
            setSaved(true);
          }}
        >
          <label className="field">
            DISPLAY NAME
            <input name="displayName" defaultValue={profile.displayName} maxLength={24} required />
          </label>
          <label className="field">
            DEFAULT DIFFICULTY
            <select name="difficulty" defaultValue={profile.settings.difficulty}>
              <option value="easy">Easy · build your rhythm</option>
              <option value="normal">Normal · find your edge</option>
              <option value="hard">Hard · challenge your limits</option>
            </select>
          </label>
          <label className="toggle-row">
            <span>
              <strong>Game sound</strong>
              <small>Synthesized effects for boosts, strikes, and victories.</small>
            </span>
            <input type="checkbox" name="sound" defaultChecked={profile.settings.sound} />
          </label>
          <label className="field">
            SOUND VOLUME
            <input
              aria-label="Sound volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              name="volume"
              defaultValue={profile.settings.volume}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Reduce motion</strong>
              <small>Reduce screen shake, particles, and decorative motion.</small>
            </span>
            <input
              type="checkbox"
              name="reducedMotion"
              defaultChecked={profile.settings.reducedMotion}
            />
          </label>
          <div className="form-actions">
            <button className="button primary" type="submit">
              <Save size={17} /> Save settings
            </button>
            {saved && <span role="status">Settings saved.</span>}
          </div>
        </form>
      )}
      <div className="panel danger-panel">
        <h2>A fresh start</h2>
        <p>Reset your XP, records, unlocks, and settings on this browser.</p>
        {confirm ? (
          <div role="alert">
            <p>This will permanently clear your local progress. Continue?</p>
            <div className="button-row">
              <button
                className="button danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                  setSaved(false);
                }}
              >
                Yes, reset everything
              </button>
              <button className="button secondary" onClick={() => setConfirm(false)}>
                Keep my progress
              </button>
            </div>
          </div>
        ) : (
          <button className="button secondary" onClick={() => setConfirm(true)}>
            <RotateCcw size={16} /> Reset progress
          </button>
        )}
      </div>
    </>
  );
}
