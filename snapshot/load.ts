import type { IFs } from "memfs";
import * as snapshot from "memfs/lib/snapshot/index.js";
import jsonData from "./node_modules.json" with { type: "json" };

export function load(fs: IFs): void {
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(JSON.stringify(jsonData)) as any;
  snapshot.fromJsonSnapshotSync(uint8, { fs, path: "node_modules" });
}
