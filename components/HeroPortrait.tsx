import { useId } from "react";
import { heroStyles, type HeroId } from "@/game/data/heroStyles";

/** Open faces, light armor, and four different weapons distinguish the hero roster. */
export function HeroPortrait({
  hero,
  color,
  className = "",
}: {
  hero: HeroId;
  color: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const palette = heroStyles[hero];
  return (
    <svg
      className={`arena-art hero-portrait ${className}`}
      viewBox="0 0 520 300"
      fill="none"
      aria-hidden="true"
      data-hero={hero}
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={color} stopOpacity=".38" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-armor`}
          x1="220"
          y1="100"
          x2="300"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={palette.light} />
          <stop offset=".55" stopColor={color} />
          <stop offset="1" stopColor={palette.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="270" cy="150" rx="202" ry="146" fill={`url(#${id}-halo)`} />
      <circle cx="270" cy="137" r="108" stroke={color} strokeOpacity=".3" />
      <path d="M84 258H451M136 276H398M176 240H361" stroke={color} strokeOpacity=".2" />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`m${110 + i * 37} ${62 + (i % 3) * 28} 3-6 3 6-3 6Z`}
          fill={palette.light}
          opacity=".5"
        />
      ))}
      <ellipse cx="274" cy="272" rx="94" ry="14" fill="#080f22" opacity=".6" />
      <path
        d={
          hero === "storm"
            ? "M242 112 204 151 182 224 244 198 288 130Z"
            : "M237 111 206 143 183 253 246 228 316 253 301 122Z"
        }
        fill={palette.light}
        opacity=".85"
        stroke={color}
      />
      <path
        d="m251 192-21 63-11 15h33l23-59 24 59h32l-13-19-18-58Z"
        fill={palette.dark}
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="m226 249 22 3-7 20h-32Zm74 3 23-3 17 23h-35Z"
        fill={palette.light}
        stroke={color}
        strokeWidth="2"
      />
      {hero === "crystal" ? (
        <path
          d="m240 116-18 49-22 79 66-11 60 11-20-82-17-44Z"
          fill={`url(#${id}-armor)`}
          stroke={palette.light}
          strokeWidth="2"
        />
      ) : (
        <path
          d={
            hero === "ember"
              ? "m237 112-20 30 22 66 61 1 24-65-27-30Z"
              : "m242 113-20 31 17 61h63l16-63-24-28Z"
          }
          fill={`url(#${id}-armor)`}
          stroke={palette.light}
          strokeWidth="2"
        />
      )}
      <path
        d="M240 146 270 157 300 145M269 160V194"
        stroke={palette.dark}
        strokeOpacity=".6"
        strokeWidth="3"
      />
      <path d="m257 118 13 21 13-21" stroke={palette.light} strokeWidth="6" />
      <path d="M252 95v21l18 11 17-12V94" fill={palette.skin} />
      <path
        d="M245 65Q270 45 293 65L291 89 299 95 290 101 285 111 266 116 249 103 242 83Z"
        fill={palette.skin}
        stroke={palette.light}
        strokeOpacity=".4"
      />
      <path
        d={
          hero === "crystal"
            ? "M241 89 233 66 249 48 282 46 298 65 299 111 285 101 288 68 274 75 258 66 249 91Z"
            : hero === "storm"
              ? "M242 85 235 66 250 49 278 45 298 59 292 74 274 65 259 75 248 70 247 90Z"
              : "M242 85 237 65 252 47 282 49 298 66 290 76 273 65 252 76 251 88Z"
        }
        fill={palette.hair}
      />
      <path
        d="M272 85h12M270 80l13-1"
        stroke={palette.dark}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="m277 101 9-2" stroke="#925e52" strokeWidth="2" strokeLinecap="round" />
      {hero === "solar" && (
        <path
          d="m245 68 5-14 13 9 8-15 10 15 13-7-3 15-22 4Z"
          fill={color}
          stroke={palette.light}
          strokeWidth="2"
        />
      )}
      {hero === "storm" && <path d="m249 62-28-22 5 28 16 8" fill={color} stroke={palette.light} />}
      {hero === "crystal" && (
        <path d="m268 57 8-13 8 13-8 13Z" fill={color} stroke={palette.light} strokeWidth="2" />
      )}
      {hero === "ember" && <path d="M243 74 290 70" stroke={color} strokeWidth="5" />}
      <path
        d="m233 132-31 32 24 32M302 133 329 160 357 136"
        stroke={palette.dark}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m233 129-31 32 24 32M302 130 329 157 357 133"
        stroke={color}
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m225 187 12-12 13 15-11 13Z" fill={palette.light} stroke={color} />
      {hero === "solar" && (
        <g>
          <path
            d="M198 151 230 137 261 153 253 198 230 221 207 198Z"
            fill="#f2e1b5"
            stroke={color}
            strokeWidth="4"
          />
          <path d="m230 156 6 13 14 4-14 5-6 16-6-16-13-5 13-4Z" fill={color} stroke="#a8894d" />
          <path d="m348 133 12-86 9-13 8 14-20 90Z" fill="#f8fcff" stroke={color} strokeWidth="2" />
          <path d="m338 134 32 8m-18-3-4 22" stroke={color} strokeWidth="5" />
        </g>
      )}
      {hero === "storm" && (
        <g stroke={palette.light}>
          <path d="M349 76Q408 132 351 207" stroke={color} strokeWidth="6" />
          <path d="m349 76-12 64 14 67" strokeWidth="2" />
          <path d="M319 141H399l-10-7m10 7-11 8" strokeWidth="3" />
          <path d="m371 132 12 9-13 10 11 7" stroke={color} strokeWidth="3" />
        </g>
      )}
      {hero === "crystal" && (
        <g>
          <path d="m355 118-9 141" stroke={palette.light} strokeWidth="6" />
          <path
            d="m354 67 21 28-22 30-21-29Z"
            fill={color}
            stroke={palette.light}
            strokeWidth="3"
          />
          <path d="m354 67-4 30 3 28m-21-29 18 1 25-2" stroke={palette.light} strokeOpacity=".7" />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`m${168 + i * 30} ${119 - i * 22} 8-15 9 15-9 16Z`}
              fill={color}
              opacity={0.4 + i * 0.15}
              stroke={palette.light}
            />
          ))}
        </g>
      )}
      {hero === "ember" && (
        <g>
          <path
            d="m210 177 30-6 17 21-17 22-32-10Z"
            fill={color}
            stroke={palette.light}
            strokeWidth="3"
          />
          <path
            d="m343 118 26-6 18 20-19 26-30-10Z"
            fill={color}
            stroke={palette.light}
            strokeWidth="3"
          />
          <path d="m347 118-7-27 13 9 7-29 12 24 17-8-7 31" fill="#ffd582" opacity=".7" />
          <path d="m215 179-12-28 15 9 6-27 13 30 14-4-5 18" fill="#ffd582" opacity=".7" />
        </g>
      )}
      <path d="M238 199H301" stroke={palette.light} strokeWidth="7" />
      <path d="m263 191 10 9-10 10-10-10Z" fill={color} stroke={palette.light} />
    </svg>
  );
}
