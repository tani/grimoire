import test from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import fsp from "node:fs/promises";
import { typedoc } from "./typedoc.ts";
import { npmdoc } from "./npmdoc.ts";

test("npmdoc generates doc for a remote npm package", async () => {
  const _fs = await npmdoc("markdown-it-mathjax3");
})

test("typedoc generates docs for a single entry point", async () => {
  await typedoc({
    async prehook() {
      const projectRoot = "/project";
      const entry = path.join(projectRoot, "entry.ts");
      const tsconfigPath = path.join(projectRoot, "tsconfig.json");
      const out = path.join(projectRoot, "docs");
      await fsp.mkdir(projectRoot, { recursive: true });

      await fsp.writeFile(
        entry,
        [
          "/** Adds two numbers together. */",
          "export function add(a: number, b: number) {",
          "  return a + b;",
          "}",
          "",
        ].join("\n"),
        "utf8",
      );

      await fsp.writeFile(
        tsconfigPath,
        JSON.stringify(
          {
            compilerOptions: {
              target: "ESNext",
              module: "ESNext",
            },
            files: ["entry.ts"],
            include: ["entry.ts"],
          },
          null,
          2,
        ),
        "utf8",
      );
      return {
        tsconfigPath,
        entry,
        out
      }
    },
    createCliArgs(s) {
      return [
        "--tsconfig",
        s.tsconfigPath,
        "--entryPoints",
        s.entry,
        "--out",
        s.out,
      ]
    },
    async posthook(s) {
      const html = await fsp.readFile(path.join(s.out, 'index.html'), 'utf8');
      assert.match(html, /<!DOCTYPE html>/)
    },
  });
});
