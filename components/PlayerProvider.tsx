"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { GameResult, PlayerProfile } from "@/game/types/game.types";
import { applyResult, defaultProfile, loadProfile, saveProfile } from "@/lib/storage";
import { validateProfile } from "@/lib/storage";

interface PlayerContextValue {
  profile: PlayerProfile;
  ready: boolean;
  warning: string | null;
  latestResult: GameResult | null;
  update: (profile: PlayerProfile) => void;
  record: (result: GameResult) => void;
  reset: () => void;
}
const PlayerContext = createContext<PlayerContextValue | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(defaultProfile);
  const current = useRef(profile);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const loaded = loadProfile();
      current.current = loaded.profile;
      setProfile(loaded.profile);
      setWarning(loaded.warning);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  const update = useCallback((value: PlayerProfile) => {
    const validated = validateProfile(value);
    current.current = validated;
    setProfile(validated);
    if (!saveProfile(validated))
      setWarning("Storage is unavailable or full. Progress is kept for this session.");
    else setWarning(null);
  }, []);
  const record = useCallback(
    (result: GameResult) => {
      update(applyResult(current.current, result));
      setLatestResult(result);
    },
    [update],
  );
  const reset = useCallback(() => {
    update(defaultProfile());
    setLatestResult(null);
  }, [update]);
  return (
    <PlayerContext.Provider
      value={{ profile, ready, warning, update, record, reset, latestResult }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("PlayerProvider is required");
  return context;
}
