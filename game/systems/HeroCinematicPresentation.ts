import { clamp } from "@/lib/scoring";
import type { AttackPresentation } from "@/game/systems/AttackPresentation";

export const heroCinematicMoves = {
  "dawn-slash": { motif: "blade", flight: 135, echoes: 2 },
  "aegis-charge": { motif: "shield", flight: 280, echoes: 3 },
  "sunlance-volley": { motif: "spears", flight: 470, echoes: 0 },
  "solar-judgement": { motif: "greatsword", flight: 390, echoes: 2 },
  "daybreak-ascension": { motif: "sunrise", flight: 650, echoes: 3 },
  "spark-arrow": { motif: "arrow", flight: 170, echoes: 0 },
  "thunder-volley": { motif: "arrows", flight: 425, echoes: 2 },
  "chain-lightning": { motif: "chain", flight: 240, echoes: 0 },
  "tempest-vortex": { motif: "tornado", flight: 650, echoes: 3 },
  skybreaker: { motif: "thunderbird", flight: 950, echoes: 3 },
  "prism-bolt": { motif: "prism", flight: 160, echoes: 0 },
  "crystal-bloom": { motif: "bloom", flight: 400, echoes: 0 },
  "mirror-constellation": { motif: "mirrors", flight: 400, echoes: 0 },
  "aurora-beam": { motif: "beam", flight: 480, echoes: 0 },
  "starlight-sanctuary": { motif: "sanctuary", flight: 800, echoes: 0 },
  "ember-fist": { motif: "fist", flight: 140, echoes: 1 },
  "phoenix-rush": { motif: "comet", flight: 320, echoes: 0 },
  "blazing-uppercut": { motif: "uppercut", flight: 360, echoes: 2 },
  "phoenix-wings": { motif: "wings", flight: 650, echoes: 0 },
  "phoenix-heart": { motif: "phoenix", flight: 1100, echoes: 2 },
} as const;

export function heroCinematicPresentation(plan: AttackPresentation) {
  const rank = ["basic", "special", "advanced", "ultimate", "finisher"].indexOf(plan.tier);
  const growth = 1 + Math.sqrt(clamp((plan.level ?? 1) - 1, 0, 19) / 19) * 0.22;
  return {
    rank,
    size: [0.82, 1.02, 1.22, 1.44, 1.7][rank] * growth * (0.9 + clamp(plan.quality, 0, 1) * 0.1),
  };
}
