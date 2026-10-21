import type { AttackPresentation } from "@/game/systems/AttackPresentation";

export type HeroPose = {
  x: number;
  y: number;
  tilt: number;
  arm: number;
  rear: number;
  reach: number;
  guard: number;
  step: number;
  cape: number;
};
export type HeroFrame = { at: number; pose: HeroPose; ease?: "in" | "out" | "smooth" };
export const heroRest: HeroPose = {
  x: 0,
  y: 0,
  tilt: 0,
  arm: 0,
  rear: 0,
  reach: 0,
  guard: 0,
  step: 0,
  cape: 0,
};
const pose = (values: Partial<HeroPose>): HeroPose => ({ ...heroRest, ...values });

/** Hero-only presentation. All contact times still come from combat's existing plan. */
export function heroChoreography(
  plan: AttackPresentation,
  distance: number,
  freeze: number,
): HeroFrame[] {
  const h = plan.impactMs,
    close = (gap: number) => Math.max(0, distance - gap);
  const frame = (
    at: number,
    values: Partial<HeroPose>,
    ease: HeroFrame["ease"] = "smooth",
  ): HeroFrame => ({ at, pose: pose(values), ease });
  let frames: HeroFrame[];
  let recovery: Partial<HeroPose> = { x: 12, y: 7, tilt: 5, arm: 14, rear: -15, step: 9, cape: 14 };
  switch (plan.abilityId) {
    case "dawn-slash":
      frames = [
        frame(0, {}),
        frame(95, { x: -14, y: 7, tilt: -12, arm: -80, rear: -24, step: -15, cape: 12 }),
        frame(
          h - 105,
          { x: close(240), y: -8, tilt: 6, arm: -52, rear: -24, step: 23, cape: -26 },
          "in",
        ),
        frame(
          h,
          { x: close(102), tilt: 15, arm: 72, rear: -30, reach: 10, step: 20, cape: -38 },
          "out",
        ),
      ];
      recovery = { x: close(140), y: 6, tilt: 11, arm: 91, rear: -35, step: 18, cape: 18 };
      break;
    case "aegis-charge":
      frames = [
        frame(0, {}),
        frame(180, {
          x: -24,
          y: 18,
          tilt: -13,
          arm: -25,
          rear: -65,
          guard: 20,
          step: -22,
          cape: 14,
        }),
        frame(h - 300, {
          x: -18,
          y: 12,
          tilt: -8,
          arm: -36,
          rear: -88,
          guard: 37,
          step: -18,
          cape: 23,
        }),
        frame(
          h - 130,
          { x: close(220), y: -10, tilt: 19, arm: -32, rear: -98, guard: 48, step: 31, cape: -45 },
          "in",
        ),
        frame(
          h,
          { x: close(113), y: 3, tilt: 17, arm: -40, rear: -96, guard: 57, step: 23, cape: -42 },
          "out",
        ),
      ];
      recovery = {
        x: close(150),
        y: 10,
        tilt: 8,
        arm: -14,
        rear: -80,
        guard: 28,
        step: 17,
        cape: 18,
      };
      break;
    case "sunlance-volley":
      frames = [
        frame(0, {}),
        frame(180, { x: -10, y: 9, tilt: -6, arm: -70, rear: -58, step: -11, cape: 15 }),
        frame(450, { x: 8, y: -14, tilt: -3, arm: -96, rear: -72, step: 4, cape: -22 }),
        frame(630, { x: 18, y: -10, tilt: 8, arm: -18, rear: -48, reach: 12, step: 17, cape: -25 }),
        ...Array.from({ length: 5 }, (_, i) =>
          frame(680 + i * 45, {
            x: 14 - i * 3,
            y: -11 + (i % 2) * 4,
            tilt: 7 - i,
            arm: -13 - (i % 2) * 12,
            rear: -43 + i * 3,
            reach: 12 - (i % 2) * 7,
            step: 14,
            cape: -22 + i * 3,
          }),
        ),
        frame(h, { x: 4, y: -3, tilt: 3, arm: -10, rear: -28, reach: 7, step: 8, cape: -15 }),
      ];
      break;
    case "solar-judgement":
      frames = [
        frame(0, {}),
        frame(230, { x: -18, y: 17, tilt: -14, arm: -92, rear: -30, step: -22, cape: 16 }),
        frame(
          650,
          { x: close(285), y: -33, tilt: -6, arm: -120, rear: -53, step: -17, cape: -31 },
          "out",
        ),
        frame(h - 255, {
          x: close(165),
          y: -47,
          tilt: -11,
          arm: -109,
          rear: -48,
          step: -24,
          cape: -42,
        }),
        frame(
          h - 100,
          { x: close(150), y: -29, tilt: 7, arm: -49, rear: -43, step: 12, cape: -35 },
          "in",
        ),
        frame(
          h,
          { x: close(120), y: 10, tilt: 19, arm: 81, rear: -35, reach: 9, step: 27, cape: -23 },
          "in",
        ),
      ];
      recovery = { x: close(165), y: 17, tilt: 15, arm: 94, rear: -25, step: 24, cape: 24 };
      break;
    case "daybreak-ascension":
      frames = [
        frame(0, {}),
        frame(280, { x: -14, y: 21, tilt: -9, arm: 28, rear: -65, step: -22, cape: 18 }),
        frame(690, { x: 5, y: -13, tilt: -4, arm: -86, rear: -93, step: -8, cape: -26 }),
        frame(1200, { x: 22, y: -38, tilt: -7, arm: -116, rear: -84, step: 16, cape: -38 }),
        frame(h - 510, {
          x: close(275),
          y: -48,
          tilt: -3,
          arm: -101,
          rear: -74,
          step: 21,
          cape: -44,
        }),
        frame(h - 190, {
          x: close(200),
          y: -39,
          tilt: 3,
          arm: -63,
          rear: -65,
          step: 12,
          cape: -36,
        }),
        frame(
          h,
          { x: close(142), y: 5, tilt: 17, arm: 75, rear: -40, guard: 20, step: 25, cape: -28 },
          "in",
        ),
      ];
      recovery = {
        x: close(195),
        y: 12,
        tilt: 12,
        arm: 87,
        rear: -29,
        guard: 10,
        step: 21,
        cape: 23,
      };
      break;
    case "spark-arrow":
      frames = [
        frame(0, {}),
        frame(100, {
          x: -7,
          y: 6,
          tilt: -5,
          arm: -13,
          rear: -87,
          guard: 24,
          reach: -5,
          step: -10,
          cape: 12,
        }),
        frame(
          155,
          { x: -9, y: -4, tilt: -3, arm: -5, rear: -59, guard: 18, reach: 8, step: 9, cape: -17 },
          "out",
        ),
        frame(215, { x: -24, y: -6, tilt: -13, arm: 7, rear: -31, reach: 2, step: 16, cape: -28 }),
        frame(h, { x: -12, y: -2, tilt: -6, arm: -2, rear: -30, step: 8, cape: -15 }),
      ];
      break;
    case "thunder-volley":
      frames = [
        frame(0, {}),
        frame(170, {
          x: -15,
          y: 16,
          tilt: -9,
          arm: -35,
          rear: -96,
          guard: 24,
          step: -23,
          cape: 18,
        }),
        frame(
          360,
          { x: -29, y: -31, tilt: -9, arm: -18, rear: -89, guard: 21, step: 22, cape: -31 },
          "out",
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          frame(425 + i * 66, {
            x: -29 - i * 4,
            y: -36 + (i % 2) * 9,
            tilt: -8 - i * 2,
            arm: i % 2 ? -14 : 4,
            rear: i % 2 ? -85 : -42,
            guard: i % 2 ? 25 : 12,
            reach: i % 2 ? -6 : 9,
            step: 23 - i * 3,
            cape: -36 + i * 3,
          }),
        ),
        frame(h, { x: -32, y: -4, tilt: -8, arm: 1, rear: -31, reach: 4, step: 14, cape: -22 }),
      ];
      break;
    case "chain-lightning":
      frames = [
        frame(0, {}),
        frame(200, { x: -9, y: 8, tilt: -6, arm: -35, rear: -88, guard: 22, step: -14, cape: 14 }),
        frame(540, { x: 19, y: -8, tilt: 6, arm: -48, rear: -96, guard: 28, step: 17, cape: -27 }),
        frame(h - 210, {
          x: 29,
          y: -10,
          tilt: 9,
          arm: -18,
          rear: -71,
          guard: 20,
          reach: 12,
          step: 20,
          cape: -32,
        }),
        frame(h - 100, {
          x: 12,
          y: -4,
          tilt: -3,
          arm: 5,
          rear: -35,
          reach: 4,
          step: 12,
          cape: -22,
        }),
        frame(h, { x: 23, y: -6, tilt: 8, arm: -8, rear: -27, reach: 15, step: 18, cape: -25 }),
      ];
      break;
    case "tempest-vortex":
      frames = [
        frame(0, {}),
        frame(230, {
          x: -22,
          y: 18,
          tilt: -17,
          arm: -68,
          rear: -98,
          guard: 23,
          step: -26,
          cape: 23,
        }),
        frame(
          630,
          { x: 29, y: -30, tilt: -12, arm: -86, rear: -86, guard: 23, step: 29, cape: -42 },
          "out",
        ),
        frame(h - 570, {
          x: 48,
          y: -43,
          tilt: 5,
          arm: -48,
          rear: -74,
          guard: 28,
          step: -15,
          cape: -48,
        }),
        frame(h - 300, {
          x: 58,
          y: -19,
          tilt: 14,
          arm: 23,
          rear: -32,
          reach: 13,
          step: 25,
          cape: -38,
        }),
        frame(h, { x: 46, y: 2, tilt: 8, arm: 13, rear: -25, reach: 7, step: 18, cape: -26 }),
      ];
      break;
    case "skybreaker":
      frames = [
        frame(0, {}),
        frame(280, {
          x: -21,
          y: 21,
          tilt: -11,
          arm: -45,
          rear: -103,
          guard: 23,
          step: -27,
          cape: 21,
        }),
        frame(780, {
          x: 1,
          y: -21,
          tilt: -9,
          arm: -69,
          rear: -106,
          guard: 27,
          step: 14,
          cape: -30,
        }),
        frame(1260, {
          x: 28,
          y: -51,
          tilt: -14,
          arm: -57,
          rear: -114,
          guard: 31,
          reach: -7,
          step: 27,
          cape: -43,
        }),
        frame(h - 340, {
          x: 35,
          y: -46,
          tilt: -11,
          arm: -38,
          rear: -100,
          guard: 26,
          reach: -4,
          step: 24,
          cape: -42,
        }),
        frame(
          h - 215,
          { x: 8, y: -58, tilt: -23, arm: -17, rear: -40, reach: 15, step: 17, cape: -51 },
          "out",
        ),
        frame(h, { x: 15, y: -24, tilt: -10, arm: -11, rear: -31, reach: 6, step: 15, cape: -26 }),
      ];
      recovery = { x: 1, y: 11, tilt: -4, arm: -6, rear: -24, step: 21, cape: 23 };
      break;
    case "prism-bolt":
      frames = [
        frame(0, {}),
        frame(105, { x: -8, y: 6, tilt: -8, arm: -38, rear: -29, step: -12, cape: 12 }),
        frame(
          170,
          { x: 12, y: -7, tilt: 8, arm: 18, rear: -55, reach: 13, step: 17, cape: -23 },
          "out",
        ),
        frame(230, { x: 3, y: -4, tilt: -4, arm: 29, rear: -35, reach: 7, step: 9, cape: -16 }),
        frame(h, { x: 8, y: -3, tilt: 4, arm: 16, rear: -36, reach: 8, step: 7, cape: -13 }),
      ];
      break;
    case "crystal-bloom":
      frames = [
        frame(0, {}),
        frame(180, { x: -9, y: 8, tilt: -10, arm: -34, rear: -53, step: -14, cape: 13 }),
        frame(420, { x: 7, y: -19, tilt: -8, arm: -94, rear: -78, guard: 15, step: -8, cape: -24 }),
        frame(h - 180, {
          x: 20,
          y: -7,
          tilt: 2,
          arm: -69,
          rear: -51,
          guard: 11,
          step: 15,
          cape: -28,
        }),
        frame(
          h,
          { x: 24, y: 14, tilt: 15, arm: 46, rear: -30, reach: 14, step: 23, cape: -17 },
          "in",
        ),
      ];
      recovery = { x: 13, y: 17, tilt: 8, arm: 53, rear: -20, step: 18, cape: 20 };
      break;
    case "mirror-constellation":
      frames = [
        frame(0, {}),
        frame(200, {
          x: -13,
          y: 10,
          tilt: -9,
          arm: -47,
          rear: -67,
          guard: 16,
          step: -17,
          cape: 15,
        }),
        frame(450, { x: 1, y: -17, tilt: -4, arm: -78, rear: -101, guard: 23, step: 9, cape: -29 }),
        frame(710, {
          x: 13,
          y: -25,
          tilt: 7,
          arm: -17,
          rear: -73,
          guard: 29,
          reach: 11,
          step: 15,
          cape: -37,
        }),
        frame(h - 140, {
          x: 20,
          y: -21,
          tilt: 11,
          arm: 22,
          rear: -38,
          reach: 18,
          step: 18,
          cape: -26,
        }),
        frame(h, { x: 9, y: -12, tilt: 4, arm: 11, rear: -38, reach: 7, step: 8, cape: -19 }),
      ];
      break;
    case "aurora-beam":
      frames = [
        frame(0, {}),
        frame(250, {
          x: -17,
          y: 14,
          tilt: -14,
          arm: -61,
          rear: -66,
          guard: 18,
          step: -22,
          cape: 18,
        }),
        frame(710, { x: 3, y: -13, tilt: -7, arm: -80, rear: -98, guard: 30, step: 7, cape: -25 }),
        frame(h - 350, {
          x: 9,
          y: -9,
          tilt: 7,
          arm: 13,
          rear: -75,
          guard: 42,
          reach: 17,
          step: 24,
          cape: -33,
        }),
        frame(
          h - 210,
          { x: -18, y: 2, tilt: -14, arm: 22, rear: -70, guard: 37, reach: 8, step: 29, cape: -45 },
          "out",
        ),
        frame(h, {
          x: -11,
          y: -3,
          tilt: -8,
          arm: 13,
          rear: -68,
          guard: 40,
          reach: 16,
          step: 23,
          cape: -33,
        }),
      ];
      break;
    case "starlight-sanctuary":
      frames = [
        frame(0, {}),
        frame(270, {
          x: -10,
          y: 14,
          tilt: -9,
          arm: -38,
          rear: -72,
          guard: 13,
          step: -19,
          cape: 18,
        }),
        frame(720, {
          x: 4,
          y: -24,
          tilt: -5,
          arm: -93,
          rear: -111,
          guard: 19,
          step: -9,
          cape: -30,
        }),
        frame(1250, {
          x: 26,
          y: -56,
          tilt: -4,
          arm: -123,
          rear: -126,
          guard: 25,
          step: 17,
          cape: -44,
        }),
        frame(h - 420, {
          x: 36,
          y: -62,
          tilt: 3,
          arm: -77,
          rear: -115,
          guard: 30,
          reach: 11,
          step: 23,
          cape: -46,
        }),
        frame(h - 190, {
          x: 43,
          y: -37,
          tilt: 8,
          arm: -19,
          rear: -74,
          guard: 28,
          reach: 19,
          step: 16,
          cape: -35,
        }),
        frame(h, {
          x: 33,
          y: -28,
          tilt: 4,
          arm: -28,
          rear: -67,
          guard: 18,
          reach: 10,
          step: 12,
          cape: -27,
        }),
      ];
      recovery = { x: 17, y: 8, tilt: 3, arm: -11, rear: -32, step: 17, cape: 20 };
      break;
    default:
      return [];
  }
  const contact = frames.at(-1)!;
  frames.push({ at: h + freeze, pose: { ...contact.pose } });
  frames.push(
    frame(h + freeze + Math.min(145, (plan.durationMs - h - freeze) * 0.32), recovery, "out"),
  );
  frames.push(frame(plan.durationMs - 55, {}));
  return frames;
}
