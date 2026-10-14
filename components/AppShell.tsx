"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Flag,
  Gamepad2,
  Gauge,
  Keyboard,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import { xpForLevel } from "@/lib/scoring";

const navigation = [
  { href: "/", label: "Overview", icon: Gamepad2 },
  { href: "/racing", label: "Typing Racer", icon: Flag },
  { href: "/battle", label: "Anime Battle", icon: Swords },
  { href: "/combat", label: "Combat Arena", icon: Shield },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { profile, update, warning } = usePlayer();
  const progress =
    ((profile.xp - xpForLevel(profile.level)) /
      (xpForLevel(profile.level + 1) - xpForLevel(profile.level))) *
    100;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Typing Arena home">
          <span className="brand-mark">
            <Zap size={24} fill="currentColor" />
          </span>
          <span>
            TYPING
            <span className="brand-sub">
              ARENA<span className="brand-dot">.</span>
            </span>
          </span>
        </Link>
        <div className="nav-label">YOUR PLAYGROUND</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path === href ? "active" : ""}`}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {path === href && <i />}
            </Link>
          ))}
        </nav>
        <div className="nav-label second">YOUR JOURNEY</div>
        <nav aria-label="Player navigation">
          <Link className={`nav-item ${path === "/records" ? "active" : ""}`} href="/records">
            <Trophy size={18} />
            <span>Personal records</span>
          </Link>
          <Link className={`nav-item ${path === "/characters" ? "active" : ""}`} href="/characters">
            <Sparkles size={18} />
            <span>Fighter collection</span>
          </Link>
          <Link className={`nav-item ${path === "/settings" ? "active" : ""}`} href="/settings">
            <Settings2 size={18} />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="practice-note">
            <Keyboard size={22} />
            <strong>Every keystroke counts.</strong>
            <p>
              Build your speed.
              <br />
              Find your flow.
            </p>
            <Link href="/modes">
              Enter the arena <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="local-badge">
            <span className="status-dot" /> LOCAL PLAY · NO SIGN-UP
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            THE ARENA <span>/</span>{" "}
            <strong>{path === "/" ? "OVERVIEW" : path.slice(1).toUpperCase()}</strong>
          </div>
          <div className="topbar-right">
            <button
              className="icon-button"
              aria-label={profile.settings.sound ? "Mute sound" : "Enable sound"}
              onClick={() =>
                update({
                  ...profile,
                  settings: { ...profile.settings, sound: !profile.settings.sound },
                })
              }
            >
              {profile.settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <span className="top-divider" />
            <Link href="/settings" className="avatar" aria-label="Player settings">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </Link>
            <div className="player-label">
              <strong>{profile.displayName}</strong>
              <span>Level {profile.level} · Rookie to legend</span>
            </div>
          </div>
        </header>
        <main id="main" className="main-content">
          {warning && (
            <div role="status" className="notice">
              {warning}
            </div>
          )}
          {children}
        </main>
        <footer className="footer">
          <span>
            <Keyboard size={14} /> Made for the love of typing.
          </span>
          <div className="footer-attribution">
            Developed and owned by{" "}
            <a
              className="footer-credit"
              href="https://manojkumar-dev.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              <strong>Manojkumar</strong>
            </a>
          </div>
          <span>
            <span className="status-dot" /> All systems ready{" "}
            <span className="footer-version">v1.0</span>
          </span>
        </footer>
      </div>
      <div className="mobile-level">
        <Gauge size={14} /> LVL {profile.level}
        <div className="meter">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
