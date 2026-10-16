import { useId } from "react";
import type { Mode } from "@/game/types/game.types";
import { BoxingArt } from "@/components/BoxingArt";

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
      {mode === "racing" ? (
        <g>
          <path
            d="M-60 285 540 42M-80 310 540 68M150 330 580 139M280 330 580 182"
            stroke={color}
            strokeOpacity=".23"
          />
          <path d="m38 254 115-54m251-75 89-42M10 227l65-30" stroke={color} strokeWidth="3" />
          <ellipse cx="286" cy="234" rx="162" ry="29" fill="#050916" opacity=".8" />
          <g transform="translate(50 14) rotate(-12 260 170)">
            <path
              d="m90 165 56-45 112-17 60 43 70 27 9 45-53 20-226-2-40-32Z"
              fill={`url(#${id}-g)`}
              stroke={color}
              strokeWidth="2"
            />
            <path
              d="m147 125 108-14 48 36-184 20Z"
              fill="#0a1026"
              stroke={color}
              strokeOpacity=".6"
            />
            <path
              d="m219 116 16 36m-113 34 182-26 61 18-183 40-93-17"
              stroke={color}
              strokeOpacity=".45"
              strokeWidth="2"
            />
            <path d="m315 189 66-7-8 18-58 13Z" fill="#080f21" />
            <path d="m316 188 20-5m28-8 19-4m-283 7 22-4" stroke="#e2f3ff" strokeWidth="6" />
            <path d="m318 223 59-17" stroke={color} strokeWidth="3" />
            <ellipse
              cx="149"
              cy="223"
              rx="26"
              ry="31"
              fill="#070a12"
              stroke="#435675"
              strokeWidth="5"
            />
            <ellipse
              cx="149"
              cy="223"
              rx="13"
              ry="17"
              fill="#1e2a43"
              stroke={color}
              strokeWidth="2"
            />
            <ellipse
              cx="310"
              cy="233"
              rx="25"
              ry="30"
              fill="#070a12"
              stroke="#435675"
              strokeWidth="5"
            />
            <ellipse
              cx="310"
              cy="233"
              rx="12"
              ry="16"
              fill="#1e2a43"
              stroke={color}
              strokeWidth="2"
            />
            <path d="m83 180-8-15 26-10 3 12m223-17 54-6 3 10-51 7" fill="#8fbaff" />
            <path d="m77 220-44 3 36-15" fill={color} opacity=".7" />
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
