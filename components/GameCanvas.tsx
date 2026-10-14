"use client";
import { useEffect, useRef, useState } from "react";
import type { GameSession } from "@/game/systems/GameSession";
import { RacingSession } from "@/game/systems/RacingSession";
import { BattleSession } from "@/game/systems/BattleSession";
import { BoxingSession } from "@/game/systems/BoxingSession";

export function GameCanvas({
  session,
  reducedMotion,
}: {
  session: GameSession;
  reducedMotion: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let game: import("phaser").Game | undefined;
    let resizeObserver: ResizeObserver | undefined;
    const boot = async () => {
      try {
        const [Phaser, { BootScene }, { RacingScene }] = await Promise.all([
          import("phaser"),
          import("@/game/scenes/BootScene"),
          import("@/game/scenes/RacingScene"),
        ]);
        if (cancelled || !container.current) return;
        let scene: import("phaser").Scene;
        let key: string;
        if (session instanceof RacingSession) {
          scene = new RacingScene(session, reducedMotion);
          key = "RacingScene";
        } else if (session instanceof BattleSession) {
          const { BattleScene } = await import("@/game/scenes/BattleScene");
          scene = new BattleScene(session, reducedMotion);
          key = "BattleScene";
        } else if (session instanceof BoxingSession) {
          const { CombatScene } = await import("@/game/scenes/CombatScene");
          scene = new CombatScene(session, reducedMotion);
          key = "CombatScene";
        } else throw new Error("Unsupported game mode");
        if (cancelled || !container.current) return;
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: container.current,
          width: session.mode !== "racing" && container.current.clientWidth < 600 ? 600 : 960,
          height: 410,
          backgroundColor: "#101725",
          antialias: true,
          banner: false,
          audio: { noAudio: true },
          input: { keyboard: false, mouse: false, touch: false },
          scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
          scene: [new BootScene(key), scene],
        });
        resizeObserver = new ResizeObserver(() => {
          if (!game || !container.current) return;
          const width =
            session.mode !== "racing" && container.current.clientWidth < 600 ? 600 : 960;
          if (game.scale.gameSize.width !== width) game.scale.resize(width, 410);
          game.scale.refresh();
        });
        resizeObserver.observe(container.current);
      } catch (error) {
        console.error("Unable to start game renderer", error);
        if (!cancelled) setFailed(true);
      }
    };
    void boot();
    const pause = () => session.pause();
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
      if (game) {
        game.destroy(true);
        game = undefined;
      }
    };
  }, [session, reducedMotion]);
  return (
    <div className="canvas-wrap" aria-label={`${session.mode} game scene`} role="img">
      <div ref={container} className="canvas-host" />
      {failed && (
        <div className="canvas-error" role="alert">
          The game canvas could not start. Reload the page or try a browser with Canvas support.
        </div>
      )}
    </div>
  );
}
