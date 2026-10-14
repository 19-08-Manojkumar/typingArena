export type BoxingOpponentId = "practice" | "rookie" | "mantis";

export const boxingOpponents = {
  practice: {
    id: "practice",
    name: "Practice Pal",
    health: 75,
    description: "First steps · single words · never attacks",
    beginner: true,
    attackInterval: Infinity,
    defenseWindow: 12,
    damage: 0,
  },
  rookie: {
    id: "rookie",
    name: "Rookie Ray",
    health: 90,
    description: "Beginner · short words · gentle, slow attacks",
    beginner: true,
    attackInterval: 14,
    defenseWindow: 10,
    damage: 4,
  },
  mantis: {
    id: "mantis",
    name: "Iron Mantis",
    health: 150,
    description: "Experienced · full combinations · regular pressure",
    beginner: false,
    attackInterval: 0,
    defenseWindow: 0,
    damage: 0,
  },
} as const;
