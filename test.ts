import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { packTar } from "modern-tar";
import { npmdoc } from "./npmdoc.ts";

const packageName = "demo-package";
const tarballUrl = "https://example.invalid/demo-package-1.0.0.tgz";

test("npmdoc generates docs from a mocked npm tarball", async (t) => {
  const tarball = gzipSync(await createTarball());
  const metadataUrl =
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : String(input);

    calls.push(url);

    if (url === metadataUrl) {
      return new Response(
        JSON.stringify({
          "dist-tags": { latest: "1.0.0" },
          versions: { "1.0.0": { dist: { tarball: tarballUrl } } },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url === tarballUrl) {
      return new Response(tarball, {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      });
    }

    return new Response("not found", { status: 404 });
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const vol = await npmdoc(packageName);
  const html = await vol.promises.readFile("/docs/index.html", "utf8");

  assert.match(html.toString(), /<!DOCTYPE html>/);
  assert.match(html.toString(), new RegExp(packageName));
  assert.equal(calls.length, 2);
});

async function createTarball(): Promise<Buffer> {
  const files: Array<[string, string]> = [
    ["package/package.json", JSON.stringify({ name: packageName, version: "1.0.0" })],
    [
      "package/typedoc.json",
      JSON.stringify({ entryPoints: ["src/index.ts"], tsconfig: "tsconfig.json" }),
    ],
    [
      "package/tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
        },
        include: ["src/index.ts"],
      }),
    ],
    [
      "package/src/index.ts",
      [
        "/** Greets a user. */",
        "export function greet(name: string) {",
        "  return `hello ${name}`;",
        "}",
        "",
      ].join("\n"),
    ],
  ];

  const entries = files.map(([name, contents]) => {
    const body = Buffer.from(contents, "utf8");
    return { header: { name, mode: 0o644, size: body.length }, body };
  });

  const tar = await packTar(entries);
  return Buffer.from(tar);
}
