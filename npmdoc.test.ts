import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { packTar } from "modern-tar";
import { MockAgent, setGlobalDispatcher } from "undici";
import { npmdoc } from "./npmdoc.ts";
import { Buffer } from "node:buffer"

const packageName = "demo-package";
const tarballUrl = "https://example.invalid/demo-package-1.0.0.tgz";

test("npmdoc generates docs from a mocked npm tarball", async (t) => {
  const tarball = gzipSync(await createTarball());

  // Mock fetch with undici's MockAgent so network requests stay in-process.
  const mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);
  const calls: string[] = [];

  const registryPool = mockAgent.get("https://registry.npmjs.org");
  registryPool
    .intercept({ path: `/${encodeURIComponent(packageName)}` })
    .reply((opts) => {
      calls.push(`https://registry.npmjs.org${opts.path}`);
      return {
        statusCode: 200,
        data: JSON.stringify({
          "dist-tags": { latest: "1.0.0" },
          versions: { "1.0.0": { dist: { tarball: tarballUrl } } },
        }),
        headers: { "content-type": "application/json" },
      };
    });

  const tarballPool = mockAgent.get("https://example.invalid");
  tarballPool
    .intercept({ path: "/demo-package-1.0.0.tgz" })
    .reply((opts) => {
      calls.push(`https://example.invalid${opts.path}`);
      return {
        statusCode: 200,
        data: tarball,
        headers: { "content-type": "application/octet-stream" },
      };
    });

  t.after(() => {
    mockAgent.close();
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
