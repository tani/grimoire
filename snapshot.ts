import type { IFs } from "memfs";
import * as snapshot from "memfs/lib/snapshot/index.js";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export async function dump(): Promise<void> {
  const mock = require("mock-fs");
  const fs = require("node:fs/promises");
  const path = require("node:path");
  mock({
    "node_modules/typedoc/dist": mock.load(path.dirname(require.resolve("typedoc"))),
    "node_modules/typedoc/static": mock.load(path.resolve(path.dirname(require.resolve("typedoc")), "../static/")),
    "node_modules/@gerrit0/mini-shiki/dist": mock.load(path.dirname(require.resolve("@gerrit0/mini-shiki"))),
    "node_modules/@shikijs/themes/dist": mock.load(path.dirname(require.resolve("@shikijs/themes"))),
    "node_modules/@shikijs/langs/dist": mock.load(path.dirname(require.resolve("@shikijs/langs")))
  });
  const uint8 = await snapshot.toJsonSnapshot({ fs, path: "node_modules" } as any);
  mock.restore();
  await fs.writeFile("node_modules.json", uint8);
}

export async function load(fs: IFs): Promise<void> {
  const json = require("./node_modules.json");
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(JSON.stringify(json)) as any;
  await snapshot.fromJsonSnapshot(uint8, { fs: fs.promises, path: "node_modules" });
}

if (import.meta.main) {
  dump()
}
