import type { Difficulty, PassageLength } from "@/game/types/game.types";

const passages: Record<Difficulty, string[]> = {
  easy: [
    "find your pace and keep your eyes on the road",
    "the night is still but the city never sleeps",
    "small steps and steady hands can win the race",
    "trust your rhythm and let the engine sing",
    "take a breath and make every move count",
    "follow the lights and find your way home",
    "the morning sun shines across the quiet track",
    "keep a light touch as you turn the wheel",
    "each clean lap brings a new chance to learn",
    "the open road runs beside a field of gold",
    "listen to the rain and hold a steady pace",
    "a blue car waits beside the starting line",
    "look ahead and leave some room for the turn",
    "the green light sends the whole grid forward",
    "cool air drifts in from the sea at dawn",
    "your next clean word can help you take the lead",
    "the road winds past a row of tall green trees",
    "smooth hands make every corner feel easier",
    "bright signs guide the cars through the city",
    "let the last mistake go and start fresh now",
    "watch the flags as the final lap begins",
    "the bridge leads out to a wide open valley",
    "save a little power for the long straight",
    "a clear sky stretches above the old raceway",
    "slow down your thoughts and let your fingers flow",
    "the crowd cheers as the cars pass the stands",
    "take the inside line and keep the car steady",
    "a warm breeze rolls across the empty pit lane",
    "stay calm when another car moves ahead",
    "the hills turn purple in the evening light",
    "build your speed one careful word at a time",
    "the road is clear beyond the next bend",
  ],
  normal: [
    "Neon lights trace the skyline as the engines begin to roar.",
    "Keep your focus on the next turn. Precision builds momentum.",
    "A steady rhythm will carry you further than a reckless sprint.",
    "The grandstands fall silent as the cars roll onto the starting grid.",
    "Find the opening, trust your timing, and commit to the next corner.",
    "Rain glimmers on the asphalt while the city races past.",
    "The first light of dawn reveals a narrow road through the mountains.",
    "A clean exit from the corner makes the long straight feel effortless.",
    "Keep enough space to react when the car ahead changes its line.",
    "The pit crew watches closely as the leader begins another lap.",
    "Even a small improvement can make a difference by the finish line.",
    "Beyond the old bridge, the road opens into a sunlit valley.",
    "The sound of the engines echoes between the empty city buildings.",
    "A patient driver knows when to wait and when to make a move.",
    "The flags ripple in the breeze above the entrance to the raceway.",
    "Let your hands settle into a rhythm before you push for more speed.",
    "Clouds roll over the hills while the track stays warm in the sun.",
    "The shortest route is not always the smoothest way around a corner.",
    "A silver car appears in the mirror as the next lap begins.",
    "Every straight gives you time to prepare for the bend ahead.",
    "The coastal road follows the waves all the way to the harbor.",
    "Focus on the words in front of you and let the rest of the noise fade.",
    "A quick glance at the timing board shows how close the race has become.",
    "The forest road is quiet except for the sound of tires on wet pavement.",
    "Leave the last corner behind and give the next one your full attention.",
    "As evening falls, warm lights come on along the edge of the circuit.",
    "The driver ahead brakes early, leaving just enough room to pass.",
    "A balanced pace can carry you through a race that speed alone cannot win.",
    "Fresh tire marks cross the starting line after a busy day of practice.",
    "The final stretch rewards the driver who saved a little extra power.",
    "Watch the road rise toward the ridge before it disappears around the bend.",
    "Another lap begins with a deep breath and a clear view of the track.",
  ],
  hard: [
    'At 2:45 AM, the challenger whispered: "Precision beats panic!"',
    "Velocity isn't everything; timing, accuracy, and control win races.",
    "A 97% success rate demands discipline - especially under pressure.",
    "Three rivals, two corners, one chance: don't break your rhythm.",
    "The driver's overtaking move was swift (and perfectly calculated).",
    "Shift, accelerate, recover; each split-second decision matters.",
    'The engineer called, "Box this lap!" as car #18 entered sector 3.',
    "With 1.8 seconds to the leader, there's no room for a careless exit.",
    "A 12-lap sprint requires patience, precision, and a well-timed overtake.",
    "Check the mirrors, choose your line, and brake before the 150-meter board.",
    "Despite the rain (and a fading front tire), the driver held 3rd place.",
    '"Stay focused," the crew advised; "you still have 2 laps to make it count."',
    "The dashboard read 08:32 when the convoy reached the mountain's summit.",
    "From turn 4 to turn 7, the narrow circuit offers almost no margin for error.",
    "A 0.25-second gain in sector 2 can decide an otherwise evenly matched race.",
    "Don't rush the downshift: a smooth approach makes the next corner easier.",
    "The race resumed at 6:15 PM, after a 20-minute delay for heavy rain.",
    "Car #27 crossed the line first - just 0.4 seconds ahead of its rival.",
    "Grip isn't constant; temperature, tire wear, and water all change the balance.",
    '"Clear on the left!" came the warning as 3 cars approached the hairpin.',
    "The pit stop took 4.6 seconds, but the fresh tires transformed the final stint.",
    "At 180 km/h, the distant corner arrives much sooner than you expect.",
    "One missed apex won't end the race; repeating the mistake might.",
    "The 24-hour event continued through fog, rain, and a surprisingly cold dawn.",
    "Before lap 11, the crew changed its plan: save fuel now, attack later.",
    "A driver's best tool isn't raw speed - it's the ability to adapt under pressure.",
    'The timing board flashed "P2 +0.73" as the cars entered the final sector.',
    "Brake firmly, release smoothly, then accelerate as the steering unwinds.",
    "The 3.8-kilometer circuit combines fast curves with 2 demanding chicanes.",
    "Would you risk an early pass, or wait for a cleaner chance on lap 9?",
    "After 47 minutes of racing, only 1.2 seconds separated the top 3 drivers.",
    "The marshal's yellow flag meant one thing: slow down and hold your position.",
  ],
};

interface PassageDeckState {
  remaining: number[];
  previous: number[];
}

/** Draw every sentence before recycling; never reuse part of the previous prompt. */
export class RacingPassageDeck {
  private remaining: number[] = [];
  private previous: number[] = [];
  private readonly pool: string[];

  constructor(
    difficulty: Difficulty,
    private random = Math.random,
    state?: unknown,
  ) {
    this.pool = passages[difficulty];
    if (state && typeof state === "object" && "remaining" in state && "previous" in state) {
      const valid = (value: unknown): value is number[] =>
        Array.isArray(value) &&
        value.length <= this.pool.length &&
        value.every((index) => Number.isInteger(index) && index >= 0 && index < this.pool.length) &&
        new Set(value).size === value.length;
      if (valid(state.remaining) && valid(state.previous) && state.previous.length <= 3) {
        this.remaining = [...state.remaining];
        this.previous = [...state.previous];
      }
    }
  }

  private shuffle() {
    this.remaining = this.pool.map((_, index) => index);
    for (let i = this.remaining.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
    }
  }

  next(length: PassageLength = "medium") {
    const chosen: number[] = [];
    const count = { short: 1, medium: 2, long: 3 }[length];
    while (chosen.length < count) {
      if (this.remaining.length === 0) this.shuffle();
      const candidate = this.remaining.findIndex(
        (index) => !this.previous.includes(index) && !chosen.includes(index),
      );
      if (candidate === -1) {
        this.shuffle();
        continue;
      }
      chosen.push(this.remaining.splice(candidate, 1)[0]);
    }
    this.previous = chosen;
    return chosen.map((index) => this.pool[index]).join(" ");
  }

  snapshot(): PassageDeckState {
    return { remaining: [...this.remaining], previous: [...this.previous] };
  }
}

const decks: Partial<Record<Difficulty, RacingPassageDeck>> = {};

export function getPassage(difficulty: Difficulty, length: PassageLength = "medium"): string {
  const key = `typing-arena:racing-passages:${difficulty}:v1`;
  let deck = decks[difficulty];
  if (!deck) {
    let state: unknown;
    try {
      if (typeof window !== "undefined")
        state = JSON.parse(window.sessionStorage.getItem(key) ?? "null");
    } catch {
      /* Restricted or damaged browser storage must not prevent a race. */
    }
    deck = decks[difficulty] = new RacingPassageDeck(difficulty, Math.random, state);
  }
  const passage = deck.next(length);
  try {
    if (typeof window !== "undefined")
      window.sessionStorage.setItem(key, JSON.stringify(deck.snapshot()));
  } catch {
    /* In-memory variety still works when storage is unavailable. */
  }
  return passage;
}
