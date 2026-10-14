# Typing Arena

A single Next.js application with three playable Phaser 3 typing games. React owns setup, HUDs, accessible typing input, and results; Phaser owns rendering, animation, and the simulation loop. Gameplay and personal progression run entirely in the browser.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and npm. No environment variables, accounts, secrets, database, or game server are required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` instead of `npm` if your execution policy blocks `npm.ps1`.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the production build. Dependency versions are reproducibly recorded in `package-lock.json`; Next.js is pinned to 16.3.8 and Phaser to the 3.x series. Source uses strict TypeScript, Tailwind 4, and local styles/artwork.

## Play

- **Typing Racer:** adjust difficulty, distance, and passage length, then click a vehicle to race. Correct keys add velocity; drag slows the car when you stop typing. Mistakes reduce speed and nitro. Charge the meter through accurate typing; press **Enter** or click Nitro to boost. Three vehicles are immediately available; Aurora S unlocks at level 3.
- **Anime Battle:** choose difficulty, click your fighter, then click your rival. The opponent card starts the countdown. Complete the current sentence to cast. **Alt + 1–5** or **Ctrl + Shift + 1–5** selects a power without leaving the typing input (plain 1–5 also works). Slots are basic, special, advanced, ultimate, and supreme. Choosing during a sentence queues the next move; choosing before typing changes the current move. Energy and cooldown requirements apply equally to mouse and keyboard selection. There are 64 local sentence variations per fighter/ability tier. Special attacks reserve energy on completion; damage lands at the animation's impact moment. Enemy attack timers pause during your cast. Better accuracy and capped speed improve damage; accuracy, speed, and player level influence effect intensity. All four original fighters are playable.
- **Combat Arena:** choose difficulty and click a bout card. Type changing combinations to punch. When the opponent attacks, a short defensive prompt replaces the current phrase. Complete it at 80% accuracy or better to block. Punches cost 18 stamina; resting and successful defense restore it. Win by knockout or by winning two of three rounds on damage. Tied rounds go to the opponent.

**Escape** pauses; use Resume or Escape from the pause dialog to continue. Leaving the browser window or hiding the tab pauses the game. Restart makes a fresh session. A dedicated compact gameplay layout keeps the canvas, status bars, abilities, and typing prompt in one viewport on supported sizes; mobile virtual keyboards are accommodated through the visual viewport where the browser exposes it.

### Five powers per fighter

Original moves remain in slots 1, 2 and 4. The new moves are in slots 3 and 5. Values below are base damage / spirit cost; actual damage depends on typing performance and fighter power, capped by remaining opponent health.

| Fighter | 1 · Basic | 2 · Special | 3 · Advanced | 4 · Ultimate | 5 · Supreme |
| --- | --- | --- | --- | --- | --- |
| Shadow Ninja | Quick Strike · 18/0 | Shadow Clone · 44/35 | Crescent Barrage · 62/60 | Energy Sphere · 78/80 | Celestial Tempest · 150/140 |
| Precision Swordsman | Sword Slash · 22/0 | Rapid Blade · 48/40 | Moonfall Cleave · 67/65 | Phantom Strike · 85/85 | Heaven Splitter · 160/150 |
| Dark Hunter | Shadow Strike · 20/0 | Shadow Summon · 50/45 | Night Warden · 68/65 | Shadow Army · 92/90 | Eclipse Dominion · 175/160 |
| Pirate Brawler | Heavy Punch · 24/0 | Power Smash · 53/45 | Tidal Breaker · 72/65 | Finisher · 95/90 | Worldbreaker · 185/150 |

Supreme powers require substantial spirit and have 28–32 second cooldowns. Build energy with accurate basic attacks. Their 3.2-second sequences feature a celestial vortex, sky-splitting blade, eclipse sovereign with a shadow legion, or giant meteor fist. Reduced motion disables these moving effects and camera shake.

## Typing rules

- Each printable character advances one position and is shown as correct or incorrect; untyped characters are pending.
- Incorrect characters do not block passage completion. They lower accuracy and gameplay effectiveness.
- Backspace removes a submitted character, resets the current streak/combo, and allows correction. Historical attempts and errors remain recorded.
- Accuracy = correct attempts / all printable attempts × 100. Backspace itself is not an attempt.
- WPM = net correct characters / 5 / elapsed active typing minutes. Countdown, pause, and battle cast animations do not count as active typing. Idle time while a typing challenge is active does count.
- Each position can earn propulsion or energy only once, preventing correction farming. Repeated keydown events and paste are ignored. A completed challenge resolves once.
- Words completed cleanly build a word combo. Racing uses consecutive correct keys for its acceleration bonus.

Prompts use an English keyboard. Mobile single-character input is supported; dictation, predictive multi-character replacements, paste, and IME composition are not scored as typing. A physical keyboard is recommended for the best game experience.

## Structure

```text
app/                  App Router pages, metadata, global and gameplay styles
components/           menus, selection, HUDs, input, profile context, results
game/data/            original characters, abilities, vehicles, challenges, assets
game/systems/         standalone typing, racing, battle and boxing simulation
game/scenes/          Phaser scenes, procedural fighter art and attack animation
game/types/           shared strict interfaces
lib/                  pure scoring, save validation, storage and synthesized audio
tests/                deterministic Vitest unit tests
e2e/                  Playwright browser playthrough and layout tests
docs/                 architecture and implementation notes
```

`GameCanvas` imports Phaser only after client mount and destroys the instance on navigation or replay. Its visibility/blur listeners and ResizeObserver are removed on cleanup. Scenes remove resize handlers on shutdown; Phaser owns and destroys their tweens, timers, textures, particles, and display objects. React owns one focused input, with no global typing listeners. Pure systems do not import Phaser or React.

`AttackPresentation` computes a bounded visual plan from ability tier and typing performance. `AttackAnimator` and `PowerEffects` execute that plan: shadow projectiles, portals, summoned creatures, armies, clones, traveling energy spheres, blade flurries, phantom strikes, shockwave punches, and the advanced/supreme sequences. Reduced-motion settings retain readable cast labels and damage feedback without moving effects or camera shake.

## Saves and offline play

The `typing-arena:v1` localStorage record stores a guest name, XP/level, records, unlocks, achievements, preferences, and settings. Data is validated, unknown versions fall back to defaults, missing fields migrate, and malformed JSON or storage failures produce a recovery notice. Each history is capped at 25 entries; battle history includes boxing. Resets require confirmation. Results are personal practice records, not trusted leaderboard entries.

Once a mode's JavaScript and renderer have loaded, its gameplay, audio, prompts, and saving require no network requests. There are no remote assets or fonts. Offline refresh and navigating to routes that have never loaded are not guaranteed; this version does not register a service worker.

## Browser testing

```sh
# Windows: uses the installed Microsoft Edge browser
npm run test:e2e

# Linux/macOS: install Playwright Chromium once, then run
npx playwright install chromium
npm run test:e2e
```

The test runner starts/reuses the local dev server at `localhost:3000`. It exercises settings and persistence, malformed saves, card selection, typing corrections, pause/resume, completed races/battles/boxing matches, replay, Phaser canvas cleanup, offline battle gameplay, viewport fit, changing prompts, shadow summon/army effects, keyboard power selection, and all eight new attack sequences. Screenshots are written to ignored `.local/`; failure traces go to ignored `test-results/`. Browser coverage is Chromium-based; Safari and real mobile virtual keyboards need separate device QA.

Use `npm run format` and `npm run format:check` for consistent formatting.

## GitHub and Vercel

The local Git repository is initialized on `main`. To connect your own empty GitHub repository:

```sh
git add .
git commit -m "Build Typing Arena"
git remote add origin https://github.com/YOUR_ACCOUNT/typing-arena.git
git push -u origin main
```

If a local implementation commit already exists, skip the first two commands. No GitHub remote is created automatically and no credentials are stored in the project.

1. Import the GitHub repository from Vercel's **Add New Project** flow.
2. Choose **Next.js**; keep the root directory at the repository root.
3. Select Node.js **24.x**. Install with `npm ci`; build with `npm run build`. Keep Vercel's default Next.js output setting.
4. Leave environment variables empty and deploy.
5. Verify all three modes and local save persistence on the deployed URL.

The production build prerenders all routes. There are no API routes, runtime database connections, persistent filesystem writes, or mandatory paid integrations.

Vercel's Hobby plan is for personal, non-commercial use. Its documentation checked on **13 October 2026** lists 100 GB Fast Data Transfer, 1,000,000 CDN requests, 100 deployments/day, and an 8 GB build-memory allowance. Usage can be paused when limits are exceeded. Check the current [Hobby plan](https://vercel.com/docs/plans/hobby), [platform limits](https://vercel.com/docs/limits), and [terms](https://vercel.com/legal/terms) before release, especially commercial use; this project does not promise free hosting at every scale or for every use.

## Assets

All car/fighter/menu artwork is original SVG or Phaser graphics created in this repository; sounds are synthesized with Web Audio. `game/data/assets.ts` centralizes the procedural texture names, palette, and audio frequencies. No third-party character artwork, signature designs, remote sounds, or paid assets are required. Phaser and Lucide retain their respective package licenses.
