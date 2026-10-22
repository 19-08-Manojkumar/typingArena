import { useId } from "react";

export function RaceCarArt({
  color,
  model = "pulse",
  className = "",
}: {
  color: string;
  model?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const muscle = model === "ignition";
  const future = model === "aurora";
  const bodyShade = /^#[\da-f]{6}$/i.test(color)
    ? `#${[1, 3, 5]
        .map((index) =>
          Math.round(parseInt(color.slice(index, index + 2), 16) * 0.86)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")}`
    : color;
  const roof = model === "specter" ? 16 : muscle ? 13 : 11;
  const points = [
    [31, 43],
    [35, 30],
    [54, 26],
    [67, roof],
    [93, roof + 2],
    [109, 28],
    [127, 32],
    [132, 42],
    [127, 52],
    [36, 52],
  ];
  const spokes = [
    [6, 0],
    [2, 6],
    [-5, 4],
    [-5, -4],
    [2, -6],
  ];

  return (
    <svg
      className={`arena-art race-car-art ${className}`}
      viewBox="14 5 138 62"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-paint`}
          x1="75"
          y1="13"
          x2="80"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" stopOpacity=".48" />
          <stop offset=".18" stopColor={color} />
          <stop offset=".72" stopColor={color} />
          <stop offset="1" stopColor={bodyShade} />
        </linearGradient>
        <linearGradient
          id={`${id}-glass`}
          x1="76"
          y1="14"
          x2="85"
          y2="33"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a8e8ff" stopOpacity=".92" />
          <stop offset=".22" stopColor="#244664" />
          <stop offset=".74" stopColor="#09172b" />
          <stop offset="1" stopColor="#030a17" />
        </linearGradient>
        <linearGradient
          id={`${id}-headlight`}
          x1="122"
          y1="32"
          x2="133"
          y2="39"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset=".4" stopColor="#d9fbff" />
          <stop offset="1" stopColor="#69cfff" />
        </linearGradient>
      </defs>
      <ellipse cx="82" cy="63" rx="62" ry="8" fill="#02050b" opacity=".65" />
      <ellipse cx="82" cy="60" rx="55" ry="5" fill={color} opacity=".13" />
      <polygon
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill={`url(#${id}-paint)`}
        stroke="#dff4ff"
        strokeOpacity=".8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d={`M56 32 68 ${roof + 3}Q70 ${roof + 1} 73 ${roof + 1}L91 ${roof + 3}Q95 ${roof + 3} 97 ${roof + 6}L106 32Z`}
        fill={`url(#${id}-glass)`}
        stroke="#b8edff"
        strokeOpacity=".86"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="m69 17-8 12h13l7-11Z" fill="#dff8ff" opacity=".19" />
      <path d="m84 18-7 11h3l7-11Z" fill="#fff" opacity=".12" />
      <path d="m83 14 3 18" stroke="#c4efff" strokeOpacity=".65" strokeWidth="1.2" />
      <path d="m105 31 17 2 4 8-21-2Z" fill="#fff" opacity=".13" />
      <path d="m35 31 20-4m49 4 19 3" stroke="#fff" strokeOpacity=".52" strokeWidth="1" />
      <path
        d="m37 43 20 2m16 1 41 2m3-1 11-2"
        stroke="#09182c"
        strokeOpacity=".54"
        strokeWidth="1.2"
      />
      <path d="M36 49h90l-3 5H39Z" fill={bodyShade} stroke="#dff4ff" strokeOpacity=".48" />
      <path d="m52 52 62 1" stroke="#dcefff" strokeOpacity=".42" strokeWidth=".8" />
      <path d="m66 35-2 14m39-14 2 14" stroke="#e8f6ff" strokeOpacity=".43" strokeWidth=".8" />
      <path
        d="m121 31 10 2 2 7-11-1-3-4Z"
        fill={`url(#${id}-headlight)`}
        stroke="#fff"
        strokeWidth=".8"
      />
      <path d="m123 33 7 1" stroke="#fff" strokeWidth=".8" />
      <path d="m132 34 13 4-13 1Z" fill="#d9f7ff" opacity=".16" />
      <path
        d="m32 32 8 1v6l-8-1Z"
        fill="#ff6b83"
        stroke="#ffd3d9"
        strokeOpacity=".72"
        strokeWidth=".6"
      />
      <path d="m33 33 5 1" stroke="#fff" strokeOpacity=".75" strokeWidth=".7" />
      {muscle ? (
        <>
          <path d="M100 29h15v4h-15Z" fill={bodyShade} />
          <path d="M42 31v-8h18v4" stroke={bodyShade} strokeWidth="3" />
          <path d="M39 20h24" stroke={bodyShade} strokeWidth="3" />
        </>
      ) : model === "specter" ? (
        <>
          <path d="M45 44h64" stroke="#e5dbff" strokeWidth="2" />
          <path d="M37 29h13" stroke="#e5dbff" strokeWidth="1.5" />
        </>
      ) : future ? (
        <>
          <path d="M42 42h73" stroke="#e2fff3" strokeWidth="2" />
          <path d="m97 31 21 4-15 6Z" fill={color} fillOpacity=".8" />
        </>
      ) : (
        <rect x="105" y="42" width="11" height="3" rx="1" fill="#102441" />
      )}
      {[-29, 30].map((wheel) => (
        <g key={wheel} transform={`translate(${wheel + 80} 50)`}>
          <circle r="11" fill="#050810" />
          <circle r="10" stroke="#29384c" strokeWidth="2" />
          <circle r="6.5" fill="#8193aa" />
          <circle r="4.5" fill="#111d30" />
          {spokes.map(([x, y]) => (
            <line key={`${x}-${y}`} x1="0" y1="0" x2={x} y2={y} stroke="#d4e8f3" strokeWidth="1" />
          ))}
        </g>
      ))}
    </svg>
  );
}
