import { useId } from "react";

/** Two grounded, opposing stances; composed to remain legible in the small mode card. */
export function BoxingArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`arena-art boxing-art ${className}`}
      viewBox="0 0 520 300"
      fill="none"
      aria-hidden="true"
      data-testid="boxing-art"
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor="#7c486d" stopOpacity=".55" />
          <stop offset="1" stopColor="#171526" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-mat`}
          x1="260"
          y1="170"
          x2="260"
          y2="295"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#30364c" />
          <stop offset="1" stopColor="#131b2c" />
        </linearGradient>
        <linearGradient
          id={`${id}-blue`}
          x1="-20"
          y1="70"
          x2="40"
          y2="170"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b9ddff" />
          <stop offset=".45" stopColor="#709fff" />
          <stop offset="1" stopColor="#3957a1" />
        </linearGradient>
        <linearGradient
          id={`${id}-red`}
          x1="-20"
          y1="70"
          x2="40"
          y2="170"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffc2bf" />
          <stop offset=".45" stopColor="#f78398" />
          <stop offset="1" stopColor="#aa3c66" />
        </linearGradient>
        <linearGradient
          id={`${id}-skin`}
          x1="-20"
          y1="70"
          x2="35"
          y2="155"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f3c29f" />
          <stop offset="1" stopColor="#a86f5e" />
        </linearGradient>
      </defs>
      <ellipse cx="270" cy="140" rx="246" ry="154" fill={`url(#${id}-halo)`} />
      <path d="M115 14 74 214H242ZM407 14 284 214H446Z" fill="#d9e6ff" opacity=".035" />
      <g fill="#9b8aac" opacity=".25">
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={39 + i * 19} cy={145 + (i % 3) * 10} r="5" />
        ))}
      </g>
      <path d="M49 205 154 163H380L478 205 448 281H69Z" fill={`url(#${id}-mat)`} stroke="#53647c" />
      <ellipse cx="264" cy="226" rx="117" ry="33" stroke="#71839d" strokeOpacity=".35" />
      <path d="M191 225H330M258 202V248" stroke="#71839d" strokeOpacity=".2" />
      <g strokeWidth="3">
        <path d="M49 168H478M49 192H478" stroke="#ad7189" strokeOpacity=".6" />
        <path d="M49 180H478" stroke="#adc5df" strokeOpacity=".6" />
      </g>
      {[false, true].map((opponent) => (
        <g
          key={String(opponent)}
          transform={opponent ? "translate(352 18) scale(-1 1)" : "translate(169 18)"}
        >
          <ellipse cx="4" cy="245" rx="69" ry="10" fill="#060b18" opacity=".65" />
          <path
            d="M-14 174-30 206-43 234M16 174 28 204 48 233"
            stroke="#091323"
            strokeWidth="25"
            strokeLinecap="round"
          />
          <path
            d="M-14 180-27 206M16 180 27 204"
            stroke="#69798b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="m-53 230 22 1 8 12h-37Zm91 0 19 1 10 12H34Z"
            fill={opponent ? "#d77792" : "#729ee4"}
            stroke="#c8d7e4"
            strokeWidth="2"
          />
          <path
            d="M-16 87Q-39 101-32 135L-22 160 28 163 34 117Q31 95 13 89Z"
            fill={`url(#${id}-skin)`}
            stroke="#f6d3b1"
            strokeOpacity=".35"
          />
          <path
            d="M-26 117 7 130 26 115M7 132 5 155"
            stroke="#844c48"
            strokeWidth="2"
            strokeOpacity=".65"
          />
          <path
            d="m-25 151 52 2 7 29-23 9-8-18-9 19-29-8Z"
            fill={`url(#${id}-${opponent ? "red" : "blue"})`}
            stroke="#b7c9dc"
            strokeOpacity=".4"
          />
          <path d="m-25 153 52 2" stroke="#eef0e9" strokeWidth="8" />
          <path d="M-5 83V96H13V79" fill="#b47f66" />
          <path
            d="M-15 47Q0 35 19 46L23 58 29 68 23 73 21 83 6 91-10 83-17 63Z"
            fill={opponent ? "#c38d75" : "#e4b18e"}
            stroke="#edc3a1"
            strokeOpacity=".35"
          />
          <path d="M-17 60-20 45-8 33 10 33 23 42 24 54 8 50-9 57-8 69-16 69Z" fill="#162135" />
          <path d="M11 62h9" stroke="#111c2b" strokeWidth="3" />
          <path d="m13 78 9-1" stroke="#6d4343" strokeWidth="2" />
          <path
            d="M-24 104-40 130-20 105M22 108 44 120 61 87"
            stroke="#774b46"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M-24 100-39 127-20 102M22 104 44 116 60 84"
            stroke={opponent ? "#bd866f" : "#e2ae8c"}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="translate(-23 80) rotate(-14)">
            <rect x="-7" y="12" width="22" height="13" rx="3" fill="#e0e5e7" />
            <path
              d="M-12 3Q-13-10 1-12H14Q25-11 25 2V13Q22 23 8 20L-7 18Z"
              fill={`url(#${id}-${opponent ? "red" : "blue"})`}
              stroke="#eff6ff"
              strokeOpacity=".35"
            />
            <path
              d="M-5-5H12"
              stroke="#fff"
              strokeOpacity=".5"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(59 70) rotate(15)">
            <rect x="-8" y="12" width="23" height="14" rx="3" fill="#e0e5e7" />
            <path
              d="M-14 1Q-14-12 0-14H12Q25-13 26 0V13Q24 23 10 21L-9 17Z"
              fill={`url(#${id}-${opponent ? "red" : "blue"})`}
              stroke="#eff6ff"
              strokeOpacity=".4"
            />
            <path
              d="M-5-7H13"
              stroke="#fff"
              strokeOpacity=".6"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}
      <path d="M49 147V274M478 147V274" stroke="#39465f" strokeWidth="9" />
      <path d="M45 155h9v48h-9Z" fill="#7c9fda" />
      <path d="M474 155h9v48h-9Z" fill="#d57b93" />
      <path d="M49 255H478" stroke="#91a9c5" strokeOpacity=".6" strokeWidth="3" />
      <path d="M49 271H478" stroke="#be7d94" strokeOpacity=".6" strokeWidth="3" />
      <g stroke="#e4c6b4" strokeOpacity=".6" strokeLinecap="round">
        <path d="m255 81 5-10m9 11 7-7m-20 22-9 2" />
      </g>
    </svg>
  );
}
