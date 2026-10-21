import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import sharp from "sharp";

const root = process.cwd();
const scratch = path.join(root, ".local", "fighter-art-source");
const sources = [
  "components/HeroPortrait.tsx",
  "components/VillainPortrait.tsx",
  "game/data/heroStyles.ts",
  "game/data/characters.ts",
  "game/data/heroAbilities.ts",
  "game/data/abilities.ts",
];
const sourceText = await Promise.all(
  sources.map((file) => fs.readFile(path.join(root, file), "utf8")),
);
for (const [i, file] of sources.entries()) {
  const output = path.join(scratch, file.replace(/\.tsx?$/, ".mjs"));
  await fs.mkdir(path.dirname(output), { recursive: true });
  const code = ts
    .transpileModule(sourceText[i], {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    .outputText.replace(
      /from "@\/([^"]+)"/g,
      (_, name) => `from "${pathToFileURL(path.join(scratch, `${name}.mjs`)).href}"`,
    );
  await fs.writeFile(output, code);
}
const { HeroPortrait } = await import(
  pathToFileURL(path.join(scratch, "components/HeroPortrait.mjs"))
);
const { VillainPortrait } = await import(
  pathToFileURL(path.join(scratch, "components/VillainPortrait.mjs"))
);
const { characters } = await import(pathToFileURL(path.join(scratch, "game/data/characters.mjs")));

function parse(svg) {
  const rootNode = { tag: "root", attrs: {}, children: [] },
    stack = [rootNode];
  for (const match of svg.matchAll(/<\/?[\w:-]+\b[^>]*>/g)) {
    const token = match[0];
    if (token.startsWith("</")) {
      stack.pop();
      continue;
    }
    const tag = token.match(/^<([\w:-]+)/)[1];
    const attrs = Object.fromEntries(
      [...token.matchAll(/([\w:-]+)="([^"]*)"/g)].map((value) => [value[1], value[2]]),
    );
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!token.endsWith("/>")) stack.push(node);
  }
  return rootNode.children[0];
}
function serialize(node) {
  const attrs = Object.entries(node.attrs)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join("");
  return node.children.length
    ? `<${node.tag}${attrs}>${node.children.map(serialize).join("")}</${node.tag}>`
    : `<${node.tag}${attrs}/>`;
}

// Normalize relative movetos before splitting paired arms/hands. Geometry stays identical to the SVG.
function subpaths(d) {
  const tokens = d.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? [];
  const counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  let x = 0,
    y = 0,
    sx = 0,
    sy = 0,
    command,
    i = 0,
    segment;
  const output = [],
    n = (value) => Number(value.toFixed(5));
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++];
    const upper = command.toUpperCase(),
      relative = command !== upper;
    if (upper === "Z") {
      segment.d += "Z";
      x = sx;
      y = sy;
      command = undefined;
      continue;
    }
    const count = counts[upper];
    if (!count) throw new Error(`Unsupported SVG command ${command}`);
    const values = tokens.slice(i, i + count).map(Number);
    i += count;
    if (relative) {
      if (upper === "H") values[0] += x;
      else if (upper === "V") values[0] += y;
      else if (upper === "A") {
        values[5] += x;
        values[6] += y;
      } else
        for (let j = 0; j < count; j += 2) {
          values[j] += x;
          values[j + 1] += y;
        }
    }
    if (upper === "H") x = values[0];
    else if (upper === "V") y = values[0];
    else {
      x = values.at(-2);
      y = values.at(-1);
    }
    if (upper === "M") {
      segment = { d: "", x, y };
      output.push(segment);
      sx = x;
      sy = y;
    }
    segment.d += upper + values.map(n).join(" ");
    if (upper === "M") command = relative ? "l" : "L";
  }
  return output;
}

const scale = 0.8,
  pixels = 1.5;
const layouts = {
  solar: {
    origin: [270, 218.25],
    rear: [233, 132],
    lead: [302, 130],
    cape: [237, 111],
    split: 275,
  },
  storm: {
    origin: [270, 218.25],
    rear: [233, 132],
    lead: [302, 130],
    cape: [242, 112],
    split: 275,
  },
  crystal: {
    origin: [270, 218.25],
    rear: [233, 132],
    lead: [302, 130],
    cape: [237, 111],
    split: 275,
  },
  ember: {
    origin: [270, 218.25],
    rear: [233, 132],
    lead: [302, 130],
    cape: [237, 111],
    split: 275,
  },
  ninja: {
    origin: [270, 222.25],
    rear: [235, 137],
    lead: [295, 140],
    cape: [233, 121],
    split: 264,
  },
  swordsman: {
    origin: [270, 222.25],
    rear: [231, 140],
    lead: [301, 143],
    cape: [227, 113],
    split: 269,
  },
  hunter: {
    origin: [270, 213.25],
    rear: [221, 151],
    lead: [308, 148],
    cape: [264, 125],
    split: 264,
  },
  brawler: {
    origin: [270, 223.25],
    rear: [211, 136],
    lead: [312, 138],
    cape: [239, 112],
    split: 259,
  },
};
const sockets = {
  solar: {
    "weapon-tip": ["lead-arm", 369, 34],
    "lead-hand": ["lead-arm", 356, 134],
    "shield-core": ["rear-arm", 230, 175],
  },
  storm: {
    "weapon-tip": ["lead-arm", 399, 141],
    "lead-hand": ["lead-arm", 355, 139],
    "bow-top": ["lead-arm", 349, 76],
    "bow-bottom": ["lead-arm", 351, 207],
    "bow-draw": ["lead-arm", 337, 140],
  },
  crystal: { "weapon-tip": ["lead-arm", 354, 95], "lead-hand": ["lead-arm", 353, 134] },
  ember: { "weapon-tip": ["lead-arm", 363, 133], "lead-hand": ["lead-arm", 363, 133] },
  ninja: { "weapon-tip": ["lead-arm", 372, 107], "lead-hand": ["lead-arm", 355, 140] },
  swordsman: { "weapon-tip": ["lead-arm", 403, 24], "lead-hand": ["lead-arm", 352, 146] },
  hunter: {
    "weapon-tip": ["lead-arm", 403, 80],
    "lead-hand": ["lead-arm", 355, 171],
    "cast-origin": ["rear-arm", 160, 126],
  },
  brawler: { "weapon-tip": ["lead-arm", 371, 116], "lead-hand": ["lead-arm", 371, 116] },
};
const order = ["cape", "rear-leg", "lead-leg", "body", "rear-arm", "lead-arm", "foreground"];
const atlasFrames = {},
  rigs = {},
  pieces = [],
  inspect = process.argv.includes("--inspect");
for (const fighter of characters) {
  const id = fighter.id,
    hero = fighter.faction === "hero",
    layout = layouts[id];
  const svg = renderToStaticMarkup(
    React.createElement(hero ? HeroPortrait : VillainPortrait, {
      [hero ? "hero" : "villain"]: id,
      color: fighter.color,
    }),
  );
  const tree = parse(svg),
    defs = serialize(tree.children.find((node) => node.tag === "defs"));
  const layers = Object.fromEntries(order.map((part) => [part, []]));
  const add = (part, node, inherited = {}) =>
    layers[part].push(serialize({ ...node, attrs: { ...inherited, ...node.attrs } }));
  const split = (node, inherited) =>
    subpaths(node.attrs.d).forEach((piece) =>
      add(
        piece.x > 270 ? "lead-arm" : "rear-arm",
        { ...node, attrs: { ...node.attrs, d: piece.d } },
        inherited,
      ),
    );
  const legs = (node) => {
    for (const [part, x, width] of [
      ["rear-leg", 0, layout.split],
      ["lead-leg", layout.split, 520 - layout.split],
    ]) {
      layers[part].push(
        `<defs><clipPath id="leg-${part}"><rect x="${x}" y="0" width="${width}" height="300"/></clipPath></defs><g clip-path="url(#leg-${part})">${serialize(node)}</g>`,
      );
    }
  };
  let nodes;
  if (hero) {
    const start = tree.children.findIndex(
      (node) => node.tag === "path" && /^(M237 111|M242 112)/.test(node.attrs.d ?? ""),
    );
    if (start < 0) throw new Error(`Cape missing in ${id}`);
    nodes = tree.children.slice(start);
  } else nodes = tree.children.find((node) => node.attrs["data-portrait-detail"]).children;
  for (const [index, node] of nodes.entries()) {
    const d = node.attrs.d ?? "",
      compact = d.replaceAll(" ", "");
    if (inspect)
      console.log(id, index, node.tag, JSON.stringify(d.slice(0, 90)), JSON.stringify(node.attrs));
    if (hero) {
      if (/^(M237111|M242112)/.test(compact)) add("cape", node);
      else if (compact.startsWith("m251192")) legs(node);
      else if (compact.startsWith("m226249"))
        subpaths(d).forEach((piece) =>
          add(piece.x > 270 ? "lead-leg" : "rear-leg", {
            ...node,
            attrs: { ...node.attrs, d: piece.d },
          }),
        );
      else if (/^m233(132|129)/.test(compact)) split(node, {});
      else if (compact.startsWith("m225187")) add("rear-arm", node);
      else if (/^(M238199|m263191)/.test(compact)) add("foreground", node);
      else if (node.tag === "g") {
        for (const child of node.children) {
          const cd = (child.attrs.d ?? "").replaceAll(" ", "");
          if (id === "solar")
            add(/^(M198151|m230156)/.test(cd) ? "rear-arm" : "lead-arm", child, node.attrs);
          else if (id === "crystal" && /^(m168119|m19897|m22875)/.test(cd)) continue;
          else if (id === "ember")
            add(/^(m210177|m215179)/.test(cd) ? "rear-arm" : "lead-arm", child, node.attrs);
          else add("lead-arm", child, node.attrs);
        }
      } else add("body", node);
    } else if (id === "ninja") {
      if (node.tag === "g" || compact.startsWith("m321214")) continue;
      if (/^(M233121|m190132)/.test(compact)) add("cape", node);
      else if (compact.startsWith("m239193")) legs(node);
      else if (compact.startsWith("m208251"))
        subpaths(d).forEach((piece) =>
          add(piece.x > 270 ? "lead-leg" : "rear-leg", {
            ...node,
            attrs: { ...node.attrs, d: piece.d },
          }),
        );
      else if (/^m(235137|237136|177183|177195)/.test(compact)) split(node, {});
      else if (/^(M234195|m263189)/.test(compact)) add("foreground", node);
      else add("body", node);
    } else if (id === "swordsman") {
      if (/^(M102211|M132239)/.test(compact)) continue;
      if (/^m(227113|204154|232197)/.test(compact)) add("cape", node);
      else if (compact.startsWith("m245196")) legs(node);
      else if (compact.startsWith("m221253"))
        subpaths(d).forEach((piece) =>
          add(piece.x > 270 ? "lead-leg" : "rear-leg", {
            ...node,
            attrs: { ...node.attrs, d: piece.d },
          }),
        );
      else if (/^m(231140|232136|230187)/.test(compact)) split(node, {});
      else if (/^m(352141|337140|346155)/.test(compact) || compact.startsWith("M35363"))
        add("lead-arm", node);
      else if (compact.startsWith("m216193")) add("foreground", node);
      else add("body", node);
    } else if (id === "hunter") {
      if (node.tag === "ellipse" || node.tag === "g") continue;
      if (/^m(231116|235133)/.test(compact) || compact.startsWith("M236221")) add("cape", node);
      else if (/^m(221151|211164|160153)/.test(compact)) split(node, {});
      else if (/^m(36598|352139)/.test(compact) || compact.startsWith("M365102"))
        add("lead-arm", node);
      else if (compact.startsWith("m152109")) add("rear-arm", node);
      else add("body", node);
    } else {
      if (/^(M101236|M117251)/.test(compact)) continue;
      if (/^m(24176|310204)/.test(compact)) add("cape", node);
      else if (compact.startsWith("m231192")) legs(node);
      else if (compact.startsWith("m207250"))
        subpaths(d).forEach((piece) =>
          add(piece.x > 270 ? "lead-leg" : "rear-leg", {
            ...node,
            attrs: { ...node.attrs, d: piece.d },
          }),
        );
      else if (/^m(211136|194142|150108)/.test(compact)) split(node, {});
      else if (compact.startsWith("m147101")) add("rear-arm", node);
      else if (compact.startsWith("m34296")) add("lead-arm", node);
      else if (/^m(214198|257195)/.test(compact)) add("foreground", node);
      else add("body", node);
    }
  }
  const pivots = {
    cape: layout.cape,
    "rear-leg": [layout.split - 21, 200],
    "lead-leg": [layout.split + 14, 200],
    body: layout.origin,
    "rear-arm": layout.rear,
    "lead-arm": layout.lead,
    foreground: layout.origin,
  };
  const rig = { origin: layout.origin, scale, faction: fighter.faction, layers: [], sockets: {} };
  for (const [name, [part, x, y]] of Object.entries(sockets[id]))
    rig.sockets[name] = {
      part,
      x: (x - pivots[part][0]) * scale,
      y: (y - pivots[part][1]) * scale,
    };
  for (const part of order) {
    if (!layers[part].length) continue;
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${520 * pixels}" height="${300 * pixels}" viewBox="0 0 520 300" fill="none">${defs}${layers[part].join("")}</svg>`;
    const { data, info } = await sharp(Buffer.from(markup))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let left = info.width,
      top = info.height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (data[(y * info.width + x) * 4 + 3]) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    if (left === info.width) continue;
    left = Math.max(0, left - 2);
    top = Math.max(0, top - 2);
    right = Math.min(info.width - 1, right + 2);
    bottom = Math.min(info.height - 1, bottom + 2);
    const width = right - left + 1,
      height = bottom - top + 1;
    const png = await sharp(data, { raw: info })
      .extract({ left, top, width, height })
      .png()
      .toBuffer();
    const frame = `${id}/${part}`;
    pieces.push({ frame, png, width, height });
    rig.layers.push({
      part,
      frame,
      x: left / pixels,
      y: top / pixels,
      width: width / pixels,
      height: height / pixels,
      pivot: pivots[part],
    });
  }
  rigs[id] = rig;
}
if (inspect) process.exit(0);

const atlasWidth = 2048;
let cursorX = 2,
  cursorY = 2,
  rowHeight = 0;
const composite = [];
for (const piece of pieces.sort((a, b) => b.height - a.height)) {
  if (cursorX + piece.width + 2 > atlasWidth) {
    cursorX = 2;
    cursorY += rowHeight + 4;
    rowHeight = 0;
  }
  composite.push({ input: piece.png, left: cursorX, top: cursorY });
  atlasFrames[piece.frame] = {
    frame: { x: cursorX, y: cursorY, w: piece.width, h: piece.height },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: piece.width, h: piece.height },
    sourceSize: { w: piece.width, h: piece.height },
  };
  cursorX += piece.width + 4;
  rowHeight = Math.max(rowHeight, piece.height);
}
const atlasHeight = Math.ceil((cursorY + rowHeight + 2) / 32) * 32;
if (atlasHeight > 2048) throw new Error("Fighter atlas exceeded its 16 MB texture budget");
const atlas = await sharp({
  create: {
    width: atlasWidth,
    height: atlasHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composite)
  .png()
  .toBuffer();
const sourceHash = createHash("sha256")
  .update(sourceText.join("\n"))
  .update(await fs.readFile(path.join(root, "scripts/build-fighter-art.mjs")))
  .digest("hex");
const manifest = `// Generated by npm run art:fighters from the actual card portrait components.\nexport const fighterArtSourceHash = "${sourceHash}";\nexport const portraitAtlas = {key:"portrait-fighters",image:"/arena/fighters.png",data:"/arena/fighters.json",width:${atlasWidth},height:${atlasHeight}} as const;\nexport const fighterRigs = ${JSON.stringify(rigs, null, 2)} as const;\nexport type PortraitFighterId = keyof typeof fighterRigs;\n`;
const atlasData =
  JSON.stringify(
    {
      frames: atlasFrames,
      meta: {
        image: "fighters.png",
        format: "RGBA8888",
        size: { w: atlasWidth, h: atlasHeight },
        scale: "1",
      },
    },
    null,
    2,
  ) + "\n";
await fs.mkdir(path.join(root, "public/arena"), { recursive: true });
await fs.writeFile(path.join(root, "public/arena/fighters.png"), atlas);
await fs.writeFile(path.join(root, "public/arena/fighters.json"), atlasData);
await fs.writeFile(path.join(root, "game/data/fighterRigs.generated.ts"), manifest);
console.log(
  `Generated ${pieces.length} articulated portrait layers: ${atlasWidth}x${atlasHeight}, ${Math.round(atlas.length / 1024)} KB PNG.`,
);
