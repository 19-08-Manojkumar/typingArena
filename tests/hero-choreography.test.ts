import { describe, expect, it } from "vitest";
import { heroes } from "@/game/data/characters";
import { attackPresentation } from "@/game/systems/AttackPresentation";
import { heroChoreography, heroRest } from "@/game/systems/HeroChoreography";
import {
  heroCinematicMoves,
  heroCinematicPresentation,
} from "@/game/systems/HeroCinematicPresentation";

describe("hero attack choreography", () => {
  it("gives all twenty hero attacks distinct motifs without registering villain attacks", () => {
    expect(Object.keys(heroCinematicMoves).sort()).toEqual(
      heroes.flatMap((hero) => hero.abilities.map((ability) => ability.id)).sort(),
    );
    expect(new Set(Object.values(heroCinematicMoves).map((move) => move.motif)).size).toBe(20);
    expect(Object.values(heroCinematicMoves).every((move) => move.echoes <= 3)).toBe(true);
  });
  it("increases visual scale from attack one to five and caps experience growth", () => {
    for (const hero of heroes) {
      let previous = 0;
      for (const ability of hero.abilities) {
        const plan = attackPresentation(ability, hero.id, 100, 100);
        const visual = heroCinematicPresentation(plan);
        expect(visual.size).toBeGreaterThan(previous * 1.1);
        previous = visual.size;
        const at = (level: number) => heroCinematicPresentation({ ...plan, level });
        expect(at(5).size).toBeGreaterThan(at(1).size);
        expect(at(20).size).toBeGreaterThan(at(5).size);
        expect(at(500)).toEqual(at(20));
        expect(at(Number.NaN)).toEqual(at(1));
        expect(at(-5)).toEqual(at(1));
        expect(at(20).size).toBeLessThan(2.1);
      }
    }
  });
  it("uses multiple body and weapon poses with an exact contact hold and complete recovery", () => {
    for (const hero of heroes.filter((hero) => hero.id !== "ember"))
      for (const ability of hero.abilities)
        for (const distance of [300, 455]) {
          const plan = attackPresentation(ability, hero.id, 100, 100);
          const freeze = { basic: 0, special: 32, advanced: 40, ultimate: 52, finisher: 64 }[
            plan.tier
          ];
          const frames = heroChoreography(plan, distance, freeze);
          expect(frames.length).toBeGreaterThanOrEqual(7);
          expect(frames[0].pose).toEqual(heroRest);
          expect(frames.at(-1)!.pose).toEqual(heroRest);
          expect(frames.at(-1)!.at).toBeLessThan(plan.durationMs);
          for (let i = 0; i < frames.length; i++) {
            if (i) expect(frames[i].at).toBeGreaterThanOrEqual(frames[i - 1].at);
            expect(Object.values(frames[i].pose).every(Number.isFinite)).toBe(true);
            expect(frames[i].pose.x).toBeLessThan(distance - 50);
            expect(frames[i].pose.y).toBeGreaterThanOrEqual(-65);
          }
          const contact = frames.find((frame) => frame.at === plan.impactMs)!;
          expect(contact).toBeDefined();
          expect(frames.findLast((frame) => frame.at === plan.impactMs + freeze)!.pose).toEqual(
            contact.pose,
          );
          expect(
            new Set(
              frames
                .filter((frame) => frame.at <= plan.impactMs)
                .map((frame) => JSON.stringify(frame.pose)),
            ).size,
          ).toBeGreaterThanOrEqual(4);
        }
  });
});
