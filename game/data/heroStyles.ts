export const heroStyles = {
  solar: { skin: "#e8ba92", hair: "#ead18b", light: "#fff1cf", dark: "#4a526a" },
  storm: { skin: "#c98f6c", hair: "#514638", light: "#dffaff", dark: "#274b60" },
  crystal: { skin: "#e7bda7", hair: "#e1eafd", light: "#f1f5ff", dark: "#565b88" },
  ember: { skin: "#bc8466", hair: "#69402d", light: "#fff0d4", dark: "#684438" },
} as const;
export type HeroId = keyof typeof heroStyles;
export function isHeroId(id: string): id is HeroId {
  return Object.hasOwn(heroStyles, id);
}
