import * as mock from "mock-import";
import { proxy } from "proxyrequire";
import { vol } from "memfs";
import { ufs } from "unionfs";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export async function execTypeDocVirtually(...args: string[]) {
    mock.enableNestedImports();
    ufs.use(fs).use(vol);
    const stub = {
      "fs": ufs,
      "node:fs": ufs,
      "fs/promises": ufs.promises,
      "node:fs/promises": ufs.promises,
    } as const;
    const realm = mock.createMockImport(import.meta.url);
    try {
        Object.entries(stub).forEach(([ path, obj ])=> realm.mockImport(path, obj));
        const { execTypeDoc } = await proxy(() => require("./typedoc.ts"), stub);
        await execTypeDoc(...args);
    } finally {
        mock.disableNestedImports();
        realm.stopAll();
    }
}
