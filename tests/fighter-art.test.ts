import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { characters } from "@/game/data/characters";
import {
  fighterArtSourceHash,
  fighterRigs,
  portraitAtlas,
} from "@/game/data/fighterRigs.generated";

describe("shared card and arena artwork", () => {
  it("regenerates whenever approved portraits or their palettes change", () => {
    const sources = [
      "components/HeroPortrait.tsx",
      "components/VillainPortrait.tsx",
      "game/data/heroStyles.ts",
      "game/data/characters.ts",
      "game/data/heroAbilities.ts",
      "game/data/abilities.ts",
    ];
    const hash = createHash("sha256")
      .update(sources.map((file) => readFileSync(file, "utf8")).join("\n"))
      .update(readFileSync("scripts/build-fighter-art.mjs"))
      .digest("hex");
    expect(fighterArtSourceHash, "Run npm run art:fighters after changing portrait artwork").toBe(
      hash,
    );
  });

  it("covers all eight fighters with matching articulated outfits and weapons", () => {
    expect(Object.keys(fighterRigs).sort()).toEqual(
      characters.map((character) => character.id).sort(),
    );
    for (const rig of Object.values(fighterRigs)) {
      expect(rig.layers.map((layer) => layer.part)).toEqual(
        expect.arrayContaining(["body", "cape", "rear-arm", "lead-arm"]),
      );
      expect(rig.layers.find((layer) => layer.part === "body")!.height).toBeGreaterThan(130);
      expect(rig.sockets["weapon-tip"].part).toBe("lead-arm");
      expect(rig.sockets["lead-hand"].part).toBe("lead-arm");
      for (const socket of Object.values(rig.sockets)) {
        const layer = rig.layers.find((layer) => layer.part === socket.part)!;
        const x = layer.pivot[0] + socket.x / rig.scale;
        const y = layer.pivot[1] + socket.y / rig.scale;
        expect(x).toBeGreaterThanOrEqual(layer.x - 2);
        expect(x).toBeLessThanOrEqual(layer.x + layer.width + 2);
        expect(y).toBeGreaterThanOrEqual(layer.y - 2);
        expect(y).toBeLessThanOrEqual(layer.y + layer.height + 2);
      }
    }
  });

  it("packs every layer into one padded atlas below 8 MB decoded and 512 KB downloaded", () => {
    const data = JSON.parse(readFileSync("public/arena/fighters.json", "utf8"));
    const png = readFileSync("public/arena/fighters.png");
    expect(png.readUInt32BE(16)).toBe(portraitAtlas.width);
    expect(png.readUInt32BE(20)).toBe(portraitAtlas.height);
    expect(portraitAtlas.width * portraitAtlas.height * 4).toBeLessThan(8 * 1024 * 1024);
    expect(statSync("public/arena/fighters.png").size).toBeLessThan(512 * 1024);
    const layers = Object.values(fighterRigs)
      .map((rig) => rig.layers)
      .flat();
    expect(Object.keys(data.frames)).toHaveLength(layers.length);
    for (const layer of layers) {
      const { frame } = data.frames[layer.frame];
      expect(frame.x).toBeGreaterThanOrEqual(2);
      expect(frame.y).toBeGreaterThanOrEqual(2);
      expect(frame.x + frame.w).toBeLessThanOrEqual(portraitAtlas.width - 2);
      expect(frame.y + frame.h).toBeLessThanOrEqual(portraitAtlas.height - 2);
      expect(frame.w / layer.width).toBeCloseTo(1.5);
      expect(frame.h / layer.height).toBeCloseTo(1.5);
    }
  });
});
