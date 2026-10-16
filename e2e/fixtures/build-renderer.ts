import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

/** Bundle a test-only Phaser stage using the tools already installed with Next. */
export async function buildRenderer(name: string, sources: string[]) {
  const root = process.cwd();
  const scratch = path.join(root, ".local", name);
  for (const file of sources) {
    const output = path.join(scratch, file.replace(/\.ts$/, ".js"));
    await mkdir(path.dirname(output), { recursive: true });
    const source = await readFile(path.join(root, file), "utf8");
    await writeFile(
      output,
      ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
      }).outputText,
    );
  }
  const { webpack } = createRequire(import.meta.url)("next/dist/compiled/webpack/webpack");
  await new Promise<void>((resolve, reject) =>
    webpack(
      {
        mode: "development",
        devtool: false,
        context: root,
        entry: path.join(scratch, sources[0].replace(/\.ts$/, ".js")),
        output: { path: scratch, filename: "renderer.js" },
        resolve: {
          alias: { "@": scratch },
          extensions: [".js"],
          modules: [path.join(root, "node_modules")],
        },
      },
      (error: Error | null, stats: { hasErrors(): boolean; toString(): string }) => {
        if (error || stats.hasErrors()) reject(error || new Error(stats.toString()));
        else resolve();
      },
    ),
  );
  return readFile(path.join(scratch, "renderer.js"));
}
