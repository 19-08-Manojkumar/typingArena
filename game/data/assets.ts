/** All artwork is original and generated locally. No remote downloads are needed. */
export const assets = {
  vehicles: { texture: "arena-car", source: "BootScene generated graphics" },
  characters: { texture: "arena-fighter", source: "BootScene generated graphics" },
  backgrounds: { racing: 0x101b2a, battle: 0x16162a, combat: 0x201823 },
  tracks: { lane: 0x192839, edge: 0x497897 },
  effects: { particle: "arena-spark", maxParticles: 24 },
  sounds: { correct: 440, error: 120, boost: 660, hit: 180, win: 880, lose: 140 },
} as const;
