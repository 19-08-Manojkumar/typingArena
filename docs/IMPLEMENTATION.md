# Typing Arena implementation plan

The inspected workspace was empty. There were no existing files, Git metadata, or local AGENTS.md rules. Use npm.cmd on Windows if PowerShell blocks npm.ps1.

## Phases

1. Foundation: Next.js/React/TypeScript/Tailwind configuration; shared types; TypingEngine; passages; pure scoring; versioned storage; shell and menu; Vitest calculation/storage/typing tests.
2. Racing: vehicle data, RacingSystem, Phaser BootScene/RacingScene, client-only GameCanvas, RacingGame setup/HUD, race results; deterministic system tests.
3. Anime Battle: ability/character definitions, reusable CombatSystem, BattleScene, fighter/opponent selection, energy/cooldowns/attack resolution; combat tests.
4. Combat Arena: BoxingSystem, CombatScene, typed combinations and defense, stamina, three timed rounds and scorecards; boxing tests.
5. Polish/deployment: original local SVG artwork, sound synthesizer, shared results/records/settings, responsive and keyboard UX, browser navigation/lifecycle/replay tests, lint/typecheck/test/build, README and GitHub/Vercel instructions.

## Boundaries

- `app/`: route entry points, metadata and global styles.
- `components/`: React navigation, setup screens, accessible typing input, HUD, results and profile context.
- `game/data/`: local passages, fighters, abilities, vehicles and asset manifest.
- `game/systems/`: standalone TypeScript simulation and input models, without React or Phaser dependencies.
- `game/scenes/`: Phaser simulation ticks, rendering, animation and effects.
- `lib/`: pure scoring, validation, storage and synthesized audio.
- `tests/`: unit tests; `e2e/`: browser integration checks.

## Risks and rules

Phaser is imported only after client mount, owns its simulation loop, and is explicitly destroyed on navigation/replay. React owns a single focused input and never attaches duplicate document key listeners. Countdowns and pauses are excluded from active elapsed time; page hiding pauses simulation. Each challenge has a completion latch. A corrected position can award propulsion/energy only once. Historical wrong attempts remain in accuracy after correction. Submitted incorrect characters advance and reduce performance rather than block completion. WPM uses net correct characters / 5 / active minutes. Gameplay consumes no network APIs. Saves are validated and histories capped. Personal records are not trusted leaderboard scores.

The user specified Next.js and Vercel, so this project uses the local Sites workflow only, without substituting Vinext or Sites hosting. Remote GitHub/Vercel setup requires the user's accounts and repository destination.
