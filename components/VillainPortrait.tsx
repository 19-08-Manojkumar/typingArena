import { useId } from "react";

export type VillainId = "ninja" | "swordsman" | "hunter" | "brawler";
export function isVillainId(value: string): value is VillainId {
  return ["ninja", "swordsman", "hunter", "brawler"].includes(value);
}

/** Original portraits match the four fighters' arena outfits, weapons, and powers. */
export function VillainPortrait({
  villain,
  color,
  className = "",
}: {
  villain: VillainId;
  color: string;
  className?: string;
}) {
  const id = `villain-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={`arena-art villain-portrait ${className}`}
      viewBox="0 0 520 300"
      fill="none"
      aria-hidden="true"
      data-villain={villain}
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={color} stopOpacity=".38" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-cloth`}
          x1="215"
          y1="90"
          x2="310"
          y2="261"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor={
              villain === "brawler" ? "#944d52" : villain === "swordsman" ? "#a5d7fa" : "#363c60"
            }
          />
          <stop offset="1" stopColor="#101728" />
        </linearGradient>
        <linearGradient
          id={`${id}-steel`}
          x1="320"
          y1="190"
          x2="397"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#89a8cd" />
          <stop offset=".45" stopColor="#f1fbff" />
          <stop offset="1" stopColor="#b4def5" />
        </linearGradient>
      </defs>
      <ellipse cx="270" cy="150" rx="207" ry="148" fill={`url(#${id}-halo)`} />
      <circle cx="270" cy="151" r="111" stroke={color} strokeOpacity=".2" strokeDasharray="3 11" />
      <ellipse
        cx="269"
        cy="275"
        rx={villain === "brawler" ? 119 : 91}
        ry="13"
        fill="#060b18"
        opacity=".75"
      />

      {villain === "ninja" && (
        <g data-portrait-detail="masked-ninja-and-shadow-clones">
          {[
            { x: 125, y: 67, s: 0.65 },
            { x: 358, y: 72, s: 0.58 },
          ].map(({ x, y, s }, i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity=".28">
              <path
                d="m0 70 28-15 29 20 19 104-38-29-39 29Z"
                fill="#15192e"
                stroke={color}
                strokeWidth="2"
              />
              <path d="m5 45 3-30 23-13 26 17-5 35-19 17Z" fill="#12162a" stroke={color} />
              <path d="M16 31h12m9 0h11" stroke={color} strokeWidth="4" />
            </g>
          ))}
          <path
            d="M233 121 191 105 127 73 151 117 118 143 185 139 225 150Z"
            fill="#7254ac"
            stroke={color}
            strokeWidth="1.5"
          />
          <path d="m190 132-49-13 22-5" stroke="#d1baff" strokeOpacity=".55" strokeWidth="2" />
          <path
            d="m239 193-30 58-30 22 43 3 42-56 20 48 43 6-22-25-16-62Z"
            fill="#0b1325"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="m208 251 18 8-11 15-36-1m109-19 20-6 19 26-34-3"
            fill="#29334b"
            stroke="#a796c5"
          />
          <path
            d="m232 114-20 31 22 62 62-1 12-63-24-26Z"
            fill={`url(#${id}-cloth)`}
            stroke={color}
            strokeWidth="2"
          />
          <path d="m242 129 29 19 21-17m-39 36 29 4m-44 16 54 5" stroke="#8791b1" strokeWidth="2" />
          <path
            d="m245 106-10-29 8-26 25-10 30 22-4 40-24 22Z"
            fill="#1b2540"
            stroke={color}
            strokeWidth="1.5"
          />
          <path
            d="m235 73-2-24 15 6 8-27 14 19 19-15 4 22 18-2-13 25-34-8Z"
            fill="#090f1f"
            stroke="#7f6a9c"
          />
          <path d="m238 85 59-1-5 22-23 15-26-14Z" fill="#080e1c" />
          <path d="m246 77 13 3m15-2 13-5" stroke="#e2d4ff" strokeWidth="3" strokeLinecap="round" />
          <path
            d="m235 137-31 16-24 38 16 14 34-37m65-28 33 27 27-27"
            stroke="#131d34"
            strokeWidth="22"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="m237 136-31 18-25 36m113-48 35 23 28-24"
            stroke={color}
            strokeOpacity=".55"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="m177 183 22 13-9 17-24-13m177-72 20 1 8 19-20 9-16-16Z"
            fill="#2d354c"
            stroke="#bba4e2"
            strokeWidth="2"
          />
          <path
            d="m177 195-24 30 14-5 15-21m175-62 15-30-2 35"
            fill="#d2d8eb"
            stroke="#a78bfa"
            strokeWidth="2"
          />
          <path d="M234 195h64" stroke="#080d1d" strokeWidth="9" />
          <path d="m263 189 12 7-12 8-10-8Z" fill={color} />
          <path d="m321 214 14-19-1 15 19 7-20 1-3 19-5-18-17-5Z" fill={color} opacity=".6" />
        </g>
      )}

      {villain === "swordsman" && (
        <g data-portrait-detail="silver-duelist-and-katana">
          <path
            d="M102 211Q199 66 367 76M132 239Q235 97 408 99"
            stroke={color}
            strokeWidth="2"
            strokeOpacity=".25"
          />
          <path
            d="m227 113-31 39-25 112 72-32 71 26-4-110-25-31Z"
            fill="#dce9f6"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m204 154-14 87 37-24m68-75 7 88-18-14" stroke="#7c97bc" strokeWidth="3" />
          <path
            d="m245 196-25 57-20 19 42 3 27-55 26 54 36-2-18-22-18-57Z"
            fill="#15253b"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m221 253 22 8-8 15-35-3m94-17 20-5 18 21-36 2" fill="#cad7e8" />
          <path
            d="m239 119-14 27 14 57 58-1 12-61-24-23Z"
            fill={`url(#${id}-cloth)`}
            stroke="#d7e9f5"
            strokeWidth="2"
          />
          <path d="m238 120 25 32 23-35-16 68Z" fill="#f2f6fa" />
          <path d="m254 97 1 24 16 11 16-13-2-25" fill="#cfae9b" />
          <path
            d="m246 63 24-14 24 17-1 27-8 16-17 6-17-12-9-24Z"
            fill="#e0bdac"
            stroke="#b7c9df"
          />
          <path
            d="m240 79-10-17 19-19 17-4 27 14 10 21-17-8-4 13-11-16-17 8-5 18Z"
            fill="#dfe7f4"
          />
          <path d="m247 57-8-21 23 15m13-5 12-16 2 25" fill="#b8c9e0" />
          <path
            d="m271 83 13-2m-13-5 12-2m-4 27 7-2"
            stroke="#36485d"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="m231 140-26 29 31 24m65-50 26 26 23-24"
            stroke="#263c56"
            strokeWidth="19"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="m232 136-25 31 31 24m61-51 28 26 25-25"
            stroke="#d1e1ec"
            strokeWidth="13"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="m230 187 19-7 12 14-17 14m99-61 9-17 15 5 1 19-14 10"
            fill="#d5b29d"
            stroke="#7188a9"
            strokeWidth="2"
          />
          <path
            d="m352 141 39-100 12-17-1 22-42 100Z"
            fill={`url(#${id}-steel)`}
            stroke="#ecf7ff"
            strokeWidth="2"
          />
          <path d="m337 140 36 15m-21-9-13 31" stroke="#b3d0ef" strokeWidth="5" />
          <path d="m346 155-10 19m14-14-10 8" stroke={color} strokeWidth="3" />
          <path d="m216 193 88-4" stroke="#111c30" strokeWidth="9" />
          <path d="m232 197-58 49" stroke="#37536e" strokeWidth="9" strokeLinecap="round" />
          <path d="M353 63h39m-20-20v40" stroke="#edf9ff" strokeWidth="1.5" strokeOpacity=".8" />
        </g>
      )}

      {villain === "hunter" && (
        <g data-portrait-detail="hooded-summoner-and-night-warden">
          <ellipse
            cx="267"
            cy="263"
            rx="133"
            ry="20"
            stroke={color}
            strokeOpacity=".4"
            strokeWidth="2"
          />
          <ellipse cx="267" cy="263" rx="113" ry="13" stroke={color} strokeOpacity=".25" />
          <g opacity=".27" transform="translate(105 100) scale(.65)">
            <path
              d="m0 165 18-99 35-23 34 23 22 99-54-17Z"
              fill="#102c32"
              stroke={color}
              strokeWidth="3"
            />
            <path
              d="m26 68-3-41L54 0l29 28-3 40-25 16Z"
              fill="#091925"
              stroke={color}
              strokeWidth="2"
            />
            <path d="m37 46 12 2m15-2 10-2" stroke={color} strokeWidth="5" />
          </g>
          <path
            d="m231 116-35 37-31 114 48-13 29 17 24-16 24 15 36-17 29 13-37-118-26-30Z"
            fill="#0c1827"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="m235 133-18 66-8 55m83-122 19 61 13 63m-66-97-16 95m31-94 15 94"
            stroke="#34666b"
            strokeWidth="3"
          />
          <path
            d="m242 125-10 43 32 44 30-44-13-44Z"
            fill={`url(#${id}-cloth)`}
            stroke="#549a9a"
            strokeWidth="2"
          />
          <path
            d="m226 117-1-42 36-39 39 39 2 42-38 24Z"
            fill="#142936"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m239 107 2-28 21-22 22 26 3 24-24 21Z" fill="#050d18" />
          <path d="m247 91 12 2m10-2 12-3" stroke="#c5fff0" strokeWidth="3" strokeLinecap="round" />
          <path d="m240 123 24 18 24-18-23 36Z" fill="#2d5862" stroke={color} />
          <path
            d="m221 151-23 25-25-10m135-18 23 34 24-11"
            stroke="#1c3545"
            strokeWidth="19"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m211 164-15 12m131-8 7 16" stroke={color} strokeWidth="4" />
          <path
            d="m160 153 23 4 6 17-14 15-20-17m188-11 18-10 13 13-11 20-21-6Z"
            fill="#1e3c45"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m365 98-13 161" stroke="#6b96a0" strokeWidth="6" />
          <path
            d="M365 102Q396 47 433 78L406 83 387 105Z"
            fill="#b5d9d8"
            stroke={color}
            strokeWidth="2"
          />
          <path d="m352 139 18 1m-18 9 16 1" stroke={color} strokeWidth="3" />
          <path d="m152 109 8 14 16 3-14 8-4 16-7-14-15-5 13-7Z" fill={color} opacity=".75" />
          <path d="m262 169 8 11-8 13-8-13Z" fill={color} stroke="#bbf8de" />
          <path
            d="M236 221h11m-4-8v17m37-8 9-8-2 16"
            stroke={color}
            strokeOpacity=".7"
            strokeWidth="2"
          />
        </g>
      )}

      {villain === "brawler" && (
        <g data-portrait-detail="pirate-brawler-and-tidal-fists">
          <path
            d="M101 236Q133 178 175 220Q157 169 194 176M340 230Q370 177 416 207Q393 171 429 174"
            stroke={color}
            strokeWidth="4"
            strokeOpacity=".35"
          />
          <path
            d="M117 251Q152 218 197 249m141-3q40-27 81-4"
            stroke="#f0b8aa"
            strokeWidth="2"
            strokeOpacity=".35"
          />
          <path
            d="m231 192-25 57-25 25 48 1 30-49 34 49 45-2-26-24-20-58Z"
            fill="#263341"
            stroke="#c18c82"
            strokeWidth="2"
          />
          <path
            d="m207 250 22 6-7 21h-43m114-23 22-3 26 23-45 2"
            fill="#53403d"
            stroke="#d5a394"
            strokeWidth="2"
          />
          <path
            d="m233 111-31 24 11 70 96 1 13-71-31-25Z"
            fill="#bc8a72"
            stroke="#e3af8f"
            strokeWidth="2"
          />
          <path
            d="m231 112-24 17 11 73 26-4-1-50m49-37 27 21-15 72-22-7 3-50"
            fill={`url(#${id}-cloth)`}
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="m243 132 18 13 18-12m-17 13v43m-17-22 15 6 17-6"
            stroke="#885e53"
            strokeWidth="2"
          />
          <path d="m271 145 8 32m-12-23 11-3m-8 13 11-2" stroke="#dfb194" strokeWidth="3" />
          <path d="m248 95-1 20 16 14 22-15-1-23" fill="#b88870" />
          <path
            d="m240 65 25-15 26 15 4 27-13 19-20 7-19-14-8-24Z"
            fill="#c6987c"
            stroke="#e6b69a"
          />
          <path
            d="m233 71-3-17 16-6 6-14 20 8 14-8 11 16 14 8-13 20-14-9-12 6-13-7-14 15Z"
            fill="#282c35"
          />
          <path d="m237 75 57-5" stroke={color} strokeWidth="7" />
          <path d="m241 76-29 15 23-1-16 20 27-15" fill={color} />
          <path
            d="m266 86 15-1m-18-7 15-2m-12 25 18-4m-32 0 6 8"
            stroke="#4d3935"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="m211 136-29 17-10-24m140 9 27 17 17-34"
            stroke="#b88970"
            strokeWidth="29"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m194 142-14 13m148-13 11 12" stroke="#e5b397" strokeWidth="3" />
          <path
            d="m147 101 34-7 19 28-15 28-37-10-11-21Z"
            fill="#a46658"
            stroke={color}
            strokeWidth="3"
          />
          <path
            d="m342 96 34-9 20 26-12 30-38-7-12-23Z"
            fill="#a46658"
            stroke={color}
            strokeWidth="3"
          />
          <path
            d="m150 108 30-6m-26 15 31-6m163-8 29-8m-24 18 30-7"
            stroke="#efc1a1"
            strokeWidth="3"
          />
          <path d="m214 198 93 3" stroke="#d9bb86" strokeWidth="9" />
          <path d="m257 195 14 6-13 11-9-10Z" fill="#a78a5b" stroke="#f4d59f" strokeWidth="2" />
          <path d="m310 204 19 42-25-9 7-11-9-21" fill={color} opacity=".75" />
        </g>
      )}
      <path d="M111 280H430" stroke={color} strokeOpacity=".2" />
    </svg>
  );
}
