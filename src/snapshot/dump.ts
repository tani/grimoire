import * as snapshot from "memfs/lib/snapshot/index.js";
import { createRequire } from "node:module";

export function dump(): void {
  const require = createRequire(import.meta.url);
  const mock = require("mock-fs");
  const fs = require("node:fs");
  const path = require("node:path");
  mock({
    "/node_modules/typedoc": mock.load(
      path.resolve(path.dirname(require.resolve("typedoc")), ".."),
    ),
    "/node_modules/@gerrit0/mini-shiki/dist": mock.load(
      path.dirname(require.resolve("@gerrit0/mini-shiki")),
    ),
    "/node_modules/@shikijs/themes/dist": mock.load(
      path.dirname(require.resolve("@shikijs/themes")),
    ),
    "/node_modules/@shikijs/langs/dist": mock.load(path.dirname(require.resolve("@shikijs/langs"))),
  });
  const uint8 = snapshot.toJsonSnapshotSync({ fs, path: "/node_modules" });
  mock.restore();
  fs.writeFileSync(`${import.meta.dirname}/node_modules.json`, uint8);
}

if (import.meta.main) {
  dump();
}
