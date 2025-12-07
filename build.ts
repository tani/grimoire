import { build } from "esbuild";
import type { Plugin } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

const platform = "node";

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
          relativePath = "file:///" + relativePath;
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
  "crypto",
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
  "events",
  "http",
  "http2",
];

const shims = platform === "node" ? [] : builtins;

const defaultConfig = {
  bundle: true,
  format: "esm",
  target: "es2022",
  platform,
  alias: {
    fs: "./src/node/fs/index.ts",
    "node:fs": "./src/node/fs/index.ts",
    "fs/promises": "./src/node/fs/promises.ts",
    "node:fs/promises": "./src/node/fs/promises.ts",
    inspector: "./src/node/inspector.ts",
    "node:inspector": "./src/node/inspector.ts",
    ...Object.fromEntries(builtins.map((m) => [m, `node:${m}`])),
    ...Object.fromEntries(shims.map((m) => [`node:${m}`, `@jspm/core/nodelibs/${m}`])),
  },
  banner: {
    js: [
      'import { createRequire as __createRequire } from "node:module";',
      "const require = __createRequire(import.meta.url);",
      "const __filename = import.meta.filename;",
      "const __dirname = import.meta.dirname;",
    ].join("\n"),
  },
  plugins: [combinedTransformPlugin],
} as const;

await build({
  ...(defaultConfig as any),
  entryPoints: ["server/main.ts"],
  outfile: "dist/node/server.js",
});

await build({
  ...(defaultConfig as any),
  entryPoints: ["src/app.ts"],
  external: ["hono"],
  outfile: "dist/vercel/app.js",
});
