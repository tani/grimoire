import test from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { vol } from "memfs";
import { execTypeDocVirtually } from "./main.ts";

//test("execTypeDoc resolves for help output", async () => {
//    vol.reset();
//
//    await assert.doesNotReject(execTypeDocVirtually("--help"));
//});
//
//test("execTypeDoc rejects on invalid option", async () => {
//    vol.reset();
//
//    await assert.rejects(() => execTypeDocVirtually("--not-an-option"), {
//        message: /TypeDoc failed with exit code 1/,
//    });
//});

test("execTypeDoc generates docs for a single entry point", async () => {
    vol.reset();

    const projectRoot = "/project";
    const entry = path.join(projectRoot, "entry.ts");
    const out = path.join(projectRoot, "docs");

    await vol.promises.mkdir(projectRoot, { recursive: true });

    await vol.promises.writeFile(
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

    const tsconfigPath = path.join(projectRoot, "tsconfig.json");
    await vol.promises.writeFile(
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

    await execTypeDocVirtually("--tsconfig", tsconfigPath, "--entryPoints", entry, "--out", out);

    await assert.doesNotReject(vol.promises.access(path.join(out, "index.html")));
});
