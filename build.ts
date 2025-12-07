import { build } from "esbuild";
import type { Plugin, Loader } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import MagicString from "magic-string";

export const combinedTransformPlugin: Plugin = {
  name: "combined-transform",
  setup(build) {
    build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
      let source = await fs.readFile(args.path, "utf8");

      let isCreateRequireModified = false;
      if (source.includes("createRequire")) {
        const originalSource = source;
        source = source.replace(/const\s+require\s*=\s*createRequire\(.*?\);/g, "/* replaced */");
        source = source.replace(/const\s+req\s*=\s*createRequire\(.*?\);/g, "/* replaced */");
        source = source.replace(/return req\(/, "return require(");
        source = source.replace(/req\.resolve/, "require.resolve");
        if (source !== originalSource) {
          isCreateRequireModified = true;
        }
      }

      if (!source.includes("import.meta.url") && !isCreateRequireModified) {
        return null;
      }

      const s = new MagicString(source);
      if (source.includes("import.meta.url")) {
        let relativePath = path.relative(process.cwd(), args.path);
        relativePath = relativePath.split(path.sep).join("/");

        if (!relativePath.startsWith(".")) {
          relativePath = "file://localhost/" + relativePath;
        }

        const regex = /\bimport\.meta\.url\b/g;
        let match;

        while ((match = regex.exec(source)) !== null) {
          const start = match.index;
          const end = start + match[0].length;
          s.overwrite(start, end, JSON.stringify(relativePath));
        }
      }

      if (!s.hasChanged() && !isCreateRequireModified) {
        return null;
      }

      const ext = path.extname(args.path).slice(1);
      const loader = (
        ["js", "jsx", "ts", "tsx", "css", "json", "text", "base64", "file", "binary"].includes(ext)
          ? ext
          : "default"
      ) as Loader;

      return {
        contents: s.toString(),
        loader: loader,
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

await build({
  entryPoints: ["app.ts"],
  outfile: "dist/app.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  alias: {
    fs: "./fs/index.ts",
    "node:fs": "./fs/index.ts",
    "fs/promises": "./fs/promises.ts",
    "node:fs/promises": "./fs/promises.ts",
  },
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __path_dirname } from 'node:path';",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __path_dirname(__filename);",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  plugins: [
    combinedTransformPlugin,
  ],
});
