import { useId } from "react";
import type { Mode } from "@/game/types/game.types";
import { BoxingArt } from "@/components/BoxingArt";
import { VillainPortrait, isVillainId } from "@/components/VillainPortrait";
import { HeroPortrait } from "@/components/HeroPortrait";
import { RaceCarArt } from "@/components/RaceCarArt";
import { isHeroId } from "@/game/data/heroStyles";

/** Original vector artwork; shared visual language for menu and selection screens. */
export function ArenaArt({
  mode,
  color = "#76a9ff",
  variant = "ninja",
  className = "",
}: {
  mode: Mode;
  color?: string;
  variant?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (mode === "combat") return <BoxingArt className={className} />;
  if (mode === "racing")
    return (
      <RaceCarArt
        color={color}
        model={variant === "ninja" ? "pulse" : variant}
        className={className}
      />
    );
  if (mode === "battle" && isHeroId(variant))
    return <HeroPortrait hero={variant} color={color} className={className} />;
  if (mode === "battle" && isVillainId(variant))
    return <VillainPortrait villain={variant} color={color} className={className} />;
  return (
    <svg className={`arena-art ${className}`} viewBox="0 0 520 300" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-g`}
          x1="80"
          y1="40"
          x2="410"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop offset="1" stopColor="#131b38" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor={color} stopOpacity=".3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="290" cy="160" rx="230" ry="150" fill={`url(#${id}-glow)`} />
      {String(mode) === "racing" ? (
        <g>
          <path
            d="m-40 250 246-92M5 288l267-101m110-82 180-68M330 300l243-96"
            stroke={color}
            strokeOpacity=".16"
          />
          <path
            d="m42 263 99-37m302-118 78-30M16 228l64-24"
            stroke={color}
            strokeWidth="3"
            strokeOpacity=".5"
          />
          <path
            d="m106 275 123-47m198-104 71-27"
            stroke="#d5eaff"
            strokeWidth="2"
            strokeDasharray="12 16"
            strokeOpacity=".45"
          />
          <ellipse cx="274" cy="229" rx="157" ry="35" fill="#050916" opacity=".75" />
          <ellipse cx="280" cy="217" rx="124" ry="20" fill={color} opacity=".12" />
          <g transform="translate(4 0) rotate(-7 260 168)">
            <ellipse
              cx="149"
              cy="198"
              rx="25"
              ry="43"
              fill="#050914"
              stroke="#34445f"
              strokeWidth="5"
            />
            <ellipse
              cx="149"
              cy="198"
              rx="12"
              ry="26"
              fill="#172239"
              stroke="#8498b7"
              strokeWidth="3"
            />
            <ellipse
              cx="355"
              cy="208"
              rx="25"
              ry="43"
              fill="#050914"
              stroke="#34445f"
              strokeWidth="5"
            />
            <ellipse
              cx="355"
              cy="208"
              rx="12"
              ry="26"
              fill="#172239"
              stroke="#8498b7"
              strokeWidth="3"
            />
            <path
              d="m112 174 20-34q7-12 26-17l49-12 24-31q7-9 23-7l61 10q18 3 27 19l23 34 32 20q13 8 15 25l-7 34q-3 13-20 16l-213-5q-25-1-37-15l-20-22Z"
              fill={`url(#${id}-g)`}
              stroke={color}
              strokeWidth="2.5"
            />
            <path
              d="m207 112 26-31q5-6 15-5l59 10q12 2 19 13l19 29-125-7Z"
              fill="#0a1124"
              stroke={color}
              strokeOpacity=".7"
              strokeWidth="2"
            />
            <path
              d="m222 109 26-26m15 28 11-31m21 34 12-25"
              stroke="#b9d9ff"
              strokeOpacity=".35"
              strokeWidth="2"
            />
            <path d="m133 144 75-29 130 10 42 30-17 26-207-12Z" fill="#1a2942" fillOpacity=".7" />
            <path d="m145 153 68-27 127 8 37 20-18 18-182-10Z" fill={`url(#${id}-g)`} />
            <path
              d="m170 162 185 12-24 22-146-7Z"
              fill="#111a30"
              stroke={color}
              strokeOpacity=".55"
              strokeWidth="2"
            />
            <path
              d="m223 127 9 29m37-26 6 29m45-25 4 28"
              stroke="#d7eaff"
              strokeOpacity=".23"
              strokeWidth="2"
            />
            {variant === "ignition" ? (
              <path
                d="m169 171 37 4-20 17-33-3Zm124 9 37 3-20 17-31-3Z"
                fill="#ffd08b"
                opacity=".85"
              />
            ) : variant === "specter" ? (
              <path
                d="m161 171 51 5-25 16-41-3Zm132 11 51 4-24 15-42-3Z"
                fill="#e8ddff"
                opacity=".78"
              />
            ) : (
              <>
                <path
                  d="m179 167 35 3-17 19-29-2Zm114 9 35 3-17 18-29-2Z"
                  fill="#e5f7ff"
                  opacity=".85"
                />
                <path
                  d="m233 131 16 49m24-46 11 48"
                  stroke={color}
                  strokeWidth="5"
                  strokeOpacity=".72"
                />
              </>
            )}
            <path d="m125 170-14-7-10 10 18 13m267-20 17-7 8 12-18 14" fill="#eaf6ff" />
            <path d="m133 202 41 2m179 9 29 1" stroke={color} strokeWidth="3" strokeOpacity=".8" />
            <path d="m179 210 158 5" stroke="#dff3ff" strokeOpacity=".22" strokeWidth="2" />
            <path d="m91 186-35 8 27-20m294 43 34-11-24 21" fill={color} opacity=".7" />
          </g>
        </g>
      ) : (
        <g>
          <circle cx="280" cy="144" r="104" stroke={color} strokeOpacity=".4" />
          <circle
            cx="280"
            cy="144"
            r="117"
            stroke={color}
            strokeOpacity=".16"
            strokeDasharray="4 13"
          />
          <path
            d="m161 262 198-200M131 210l234-51M186 288 319 32"
            stroke={color}
            strokeOpacity=".3"
            strokeWidth="2"
          />
          <path
            d="m235 139-23 54-36 74 77-14 28-48 41 60 48-3-39-88-33-36Z"
            fill="#10162b"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m235 139 52 9 19 52-63 13-28-30Z" fill={`url(#${id}-g)`} />
          <path d="m226 113 9-35 36-14 31 20-4 47-25 27-37-11Z" fill="#17213a" stroke={color} />
          <path d="m226 98 4-38 21 8 10-25 20 20 20-10 8 38-34-7Z" fill="#080d1d" stroke={color} />
          <path d="m235 113 53 2-13 27-33-3Z" fill="#070c1b" />
          <path d="m239 105 13 1m20-2 13-2" stroke="#edf3ff" strokeWidth="3" />
          <path
            d="m235 146-43 16-40 45 17 13 49-30 27-9m48-21 39 23 41-19 13 12-50 42-47-26"
            fill={`url(#${id}-g)`}
            stroke={color}
          />
          <path d="m242 140-71-3-47-41 44 13 26 7 43 4" fill={color} opacity=".65" />
          {variant === "swordsman" ? (
            <path d="m330 207 69-142 8 4-64 148m-23-11 36 17" stroke="#d5d1ff" strokeWidth="6" />
          ) : variant === "hunter" ? (
            <g stroke={color} strokeWidth="3">
              <path d="m375 150 12-55 18 27-3 41-23 13-14-19Z" />
              <path d="m164 210-31-25-22 12 14 49 40 13" />
            </g>
          ) : (
            <>
              <circle cx="377" cy="169" r="23" fill={color} opacity=".25" />
              <circle cx="377" cy="169" r="12" fill="#ecedff" />
              <path d="m346 150 54 35m-27-49 9 66" stroke={color} strokeWidth="2" />
            </>
          )}
          <path d="m157 260 251 16" stroke={color} strokeOpacity=".35" />
        </g>
      )}
      <g fill={color} opacity=".65">
        <circle cx="129" cy="81" r="2" />
        <circle cx="407" cy="71" r="3" />
        <circle cx="441" cy="221" r="2" />
        <path d="m96 165 5-5 5 5-5 5Z" />
        <path d="m373 35 4-4 4 4-4 4Z" />
      </g>
    </svg>
  );
}
