"use client";
import Link from "next/link";
import { ArrowRight, Award, Clock3, Trophy } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
const modeNames = { racing: "Typing Racer", battle: "Anime Battle", combat: "Combat Arena" };
const achievements = [
  { id: "first-win", title: "First of many", description: "Win your first game." },
  { id: "precision", title: "Steady hands", description: "98% accuracy with 50+ correct keys." },
  { id: "speedster", title: "On the fast track", description: "60 WPM with 50+ correct keys." },
  {
    id: "all-rounder",
    title: "Arena explorer",
    description: "Complete a game in all three modes.",
  },
];
export default function Records() {
  const { profile } = usePlayer();
  const history = [...profile.raceHistory, ...profile.battleHistory].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR JOURNEY, ONE KEYSTROKE AT A TIME</div>
          <h1>
            Built by practice<span className="text-accent">.</span>
          </h1>
          <p>Your personal records live on this browser. Every session adds to your story.</p>
        </div>
        <Trophy className="heading-icon" />
      </div>
      <div className="records-summary panel">
        <div>
          <span>BEST WPM</span>
          <strong>{Math.round(profile.bestWpm)}</strong>
        </div>
        <div>
          <span>BEST ACCURACY</span>
          <strong>{profile.bestAccuracy.toFixed(1)}%</strong>
        </div>
        <div>
          <span>TOTAL XP</span>
          <strong>{profile.xp}</strong>
        </div>
        <div>
          <span>PLAYER LEVEL</span>
          <strong>{profile.level}</strong>
        </div>
      </div>
      <div className="section-heading">
        <h2>The little victories</h2>
        <span className="section-count">ACHIEVEMENTS</span>
      </div>
      <div className="achievement-grid">
        {achievements.map((item) => (
          <div
            className={`achievement ${profile.achievements.includes(item.id) ? "unlocked" : ""}`}
            key={item.id}
          >
            <Award size={24} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span>{profile.achievements.includes(item.id) ? "UNLOCKED" : "KEEP GOING"}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>Recently in the arena</h2>
        <span className="section-count">LAST 25 PER HISTORY</span>
      </div>
      {history.length ? (
        <div className="history-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>MODE / DATE</th>
                <th>RESULT</th>
                <th>SPEED</th>
                <th>ACCURACY</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {history.map((result) => (
                <tr key={result.id}>
                  <td>
                    <strong>{modeNames[result.mode]}</strong>
                    <span>
                      {new Date(result.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td>
                    <span className={`result-badge ${result.won ? "win" : "loss"}`}>
                      {result.won ? "VICTORY" : "DEFEAT"}
                    </span>
                  </td>
                  <td>
                    {Math.round(result.wpm)} <small>WPM</small>
                  </td>
                  <td>{result.accuracy.toFixed(1)}%</td>
                  <td className="text-accent">+{result.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state panel">
          <Clock3 size={35} />
          <h2>Your first record is waiting.</h2>
          <p>Finish a race or a match to start your journey.</p>
          <Link className="button primary" href="/modes">
            Find your arena <ArrowRight size={17} />
          </Link>
        </div>
      )}
      <p className="rules-note">
        Personal practice records only. Local saves can be changed or cleared and are not verified
        competitive rankings.
      </p>
    </>
  );
}
