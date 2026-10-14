"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  Flame,
  Gauge,
  Keyboard,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { ArenaArt } from "@/components/ArenaArt";
import { usePlayer } from "@/components/PlayerProvider";
import { xpForLevel } from "@/lib/scoring";

const developerHandle = "Manojkumar";
const developerPortfolio = "https://manojkumar-dev.vercel.app/";

const modes = [
  {
    id: "racing" as const,
    name: "Typing Racer",
    kicker: "CHASE THE FINISH LINE",
    description: "Your keyboard. Your engine. Leave your rivals in the dust.",
    color: "#64a7ff",
    icon: Gauge,
    tag: "SPEED + ACCURACY",
    href: "/racing",
  },
  {
    id: "battle" as const,
    name: "Anime Battle",
    kicker: "WORDS BECOME WEAPONS",
    description: "Choose your fighter. Channel your energy. Unleash the extraordinary.",
    color: "#b591ff",
    icon: Swords,
    tag: "POWER + PRECISION",
    href: "/battle",
  },
  {
    id: "combat" as const,
    name: "Combat Arena",
    kicker: "FIND YOUR FIGHTING RHYTHM",
    description: "Land your combos and time your defense. Own every round.",
    color: "#fa7d8b",
    icon: Crosshair,
    tag: "RHYTHM + REACTION",
    href: "/combat",
  },
];
export function GameMenu({ modesOnly = false }: { modesOnly?: boolean }) {
  const { profile } = usePlayer();
  const levelStart = xpForLevel(profile.level);
  const levelEnd = xpForLevel(profile.level + 1);
  const totalGames = profile.raceHistory.length + profile.battleHistory.length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> YOUR NEXT PERSONAL BEST STARTS HERE
          </div>
          <h1>
            {modesOnly ? (
              "Choose your arena."
            ) : (
              <>
                Less scrolling.
                <br className="mobile-only" /> More <span className="text-accent">winning.</span>
              </>
            )}
          </h1>
          <p>Turn your typing into your greatest advantage.</p>
        </div>
        <div className="keyboard-tag">
          <Keyboard size={17} />
          <span>
            POWERED BY{" "}
            <a href={developerPortfolio} target="_blank" rel="noreferrer">
              {developerHandle}
            </a>
          </span>
        </div>
      </div>
      {!modesOnly && (
        <section className="hero-panel">
          <div className="hero-grid" />
          <div className="hero-copy">
            <span className="pill">
              <Zap size={12} fill="currentColor" /> THREE MODES. ONE KEYBOARD.
            </span>
            <h2>
              Find your flow.
              <br />
              Rule the arena.
            </h2>
            <p>
              Race past your limits. Fight with every word.
              <br />
              Play your way to faster, sharper typing.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href={`/${profile.preferredMode}`}>
                Play now <ArrowRight size={18} />
              </Link>
              <a href="#game-modes" className="text-link">
                Explore modes <ChevronRight size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <span className="status-dot" /> Free to play <span>·</span> No downloads{" "}
              <span>·</span> Just you & your keyboard
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <ArenaArt mode="racing" color="#739cff" />
            <div className="floating-stat">
              <Zap size={17} />
              <div>
                <span>YOUR NEXT LEVEL</span>
                <strong>Starts with a keystroke.</strong>
              </div>
            </div>
            <span className="hero-coordinate">35° 41′ N / NEON CIRCUIT</span>
          </div>
        </section>
      )}
      {!modesOnly && (
        <section className="stats-grid" aria-label="Player statistics">
          <div className="stat-card">
            <span className="stat-icon blue">
              <Gauge size={20} />
            </span>
            <div>
              <span>BEST SPEED</span>
              <strong>
                {Math.round(profile.bestWpm)} <small>WPM</small>
              </strong>
              <p>{totalGames ? "Your personal best" : "Your story starts at zero"}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon purple">
              <Target size={20} />
            </span>
            <div>
              <span>BEST ACCURACY</span>
              <strong>
                {Math.round(profile.bestAccuracy)}
                <small>%</small>
              </strong>
              <p>Make every key count</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon coral">
              <Flame size={20} />
            </span>
            <div>
              <span>PLAYER LEVEL</span>
              <strong>
                {String(profile.level).padStart(2, "0")}{" "}
                <small>{profile.level >= 3 ? "CONTENDER" : "ROOKIE"}</small>
              </strong>
              <div className="xp-line">
                <div className="meter">
                  <span
                    style={{
                      width: `${((profile.xp - levelStart) / (levelEnd - levelStart)) * 100}%`,
                    }}
                  />
                </div>
                <span>
                  {profile.xp - levelStart} / {levelEnd - levelStart} XP
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
      <section id="game-modes">
        <div className="section-heading">
          <div>
            <h2>
              Three ways to play<span className="heading-dot">.</span>
            </h2>
            <p>Different arenas. The same unstoppable you.</p>
          </div>
          <span className="section-count">01 — 03</span>
        </div>
        <div className="mode-grid">
          {modes.map(({ id, name, kicker, description, color, icon: Icon, tag, href }, index) => (
            <Link
              href={href}
              key={id}
              className={`mode-card ${id}`}
              style={{ "--mode-color": color } as React.CSSProperties}
            >
              <div className="mode-art">
                <div className="card-grid" />
                <span className="mode-number">0{index + 1}</span>
                <ArenaArt mode={id} color={color} />
                <span className="mode-tag">
                  <Icon size={12} />
                  {tag}
                </span>
              </div>
              <div className="mode-content">
                <span className="eyebrow">{kicker}</span>
                <h3>
                  {name}
                  <ArrowRight size={22} />
                </h3>
                <p>{description}</p>
                <div className="mode-meta">
                  <span>
                    <span className="status-dot" /> SINGLE PLAYER
                  </span>
                  <span>
                    {id === "racing" ? "3+ VEHICLES" : id === "battle" ? "4 FIGHTERS" : "3 ROUNDS"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="bottom-callout">
        <span className="callout-icon">
          <Trophy size={24} />
        </span>
        <div>
          <strong>Your only competition? Yesterday’s you.</strong>
          <p>
            {totalGames
              ? `Recently played: ${modes.find((mode) => mode.id === profile.preferredMode)?.name}. Keep your momentum going.`
              : "Build your streaks, unlock achievements, and watch your personal records climb."}
          </p>
        </div>
        <Link href="/records" className="text-link">
          Your records <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
