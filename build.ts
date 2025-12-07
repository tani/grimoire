import { build } from "esbuild";
import type { Plugin } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";


export const combinedTransformPlugin: Plugin = {
  name: "combined-transform",
  setup(build) {
    build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
      let contents = await fs.readFile(args.path, "utf8");
      let changed = false;

      if (contents.includes("createRequire")) {
        const replaced = contents
          .replace(/const\s+require\s*=\s*createRequire\(.*?\);/g, "/* replaced */")
          .replace(/const\s+req\s*=\s*createRequire\(.*?\);/g, "/* replaced */")
          .replace(/return req\(/g, "return require(")
          .replace(/req\.resolve/g, "require.resolve");
        changed ||= replaced !== contents;
        contents = replaced;
      }

      if (contents.includes("import.meta.url")) {
        let relativePath = path.relative(process.cwd(), args.path);
        relativePath = relativePath.split(path.sep).join("/");
        if (!relativePath.startsWith(".")) {
          relativePath = "file://localhost/" + relativePath;
        }
        const regex = /\bimport\.meta\.url\b/g;
        const replaced = contents.replace(regex, JSON.stringify(relativePath));
        changed ||= replaced !== contents;
        contents = replaced;
      }

      if (!changed) {
        return null;
      }

      return {
        contents,
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

const builtins = [
  "os",
  "child_process",
  "stream",
  "path",
  "util",
  "zlib",
  "url",
  "module",
  "buffer",
  "assert",
  // "inspector",
  "events"
]

Object.fromEntries(builtins.map(m => [m, `@jspm/core/nodelibs/${m}`]))

await build({
  entryPoints: ["app.ts"],
  outfile: "dist/app.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  alias: {
    fs: "./node/fs/index.ts",
    "node:fs": "./node/fs/index.ts",
    "fs/promises": "./node/fs/promises.ts",
    "node:fs/promises": "./node/fs/promises.ts",
    "inspector": "./node/inspector.ts",
    "node:inspector": "./node/inspector.ts",
    ...Object.fromEntries(builtins.map(m => [m, `@jspm/core/nodelibs/${m}`])),
    ...Object.fromEntries(builtins.map(m => [`node:${m}`, `@jspm/core/nodelibs/${m}`]))
  },
  banner: {
    js: `
      const __filename = import.meta.filename;
      const __dirname = import.meta.dirname;
    `
  },
  plugins: [
    combinedTransformPlugin,
  ],
});
