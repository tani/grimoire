import fsp from "fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { unpackTar } from "modern-tar/fs";
import { Volume } from "memfs";
import { typedoc } from "./typedoc.ts";

export async function npmdoc(packagename: string) {
  return await typedoc({
    async prehook() {
      const tempRoot = await fsp.mkdtemp(path.join(tmpdir(), "npmdoc-"));
      const packageDir = path.join(tempRoot, "package");
      await fsp.mkdir(packageDir, { recursive: true });

      const { tarballUrl } = await fetchPackageMetadata(packagename);
      await downloadAndExtractTarball(tarballUrl, packageDir);

      const docsDir = path.join(tempRoot, "docs");
      const tsconfigPath = path.join(packageDir, "jsdoc.tsconfig.json");
      await createLooseTsconfig(tsconfigPath);

      return {
        tempRoot,
        packageDir,
        docsDir,
        tsconfigPath,
      };
    },
    createCliArgs(s) {
      const entryGlobs = ["**/*.{c,m,}{j,t}s", "**/*.d.ts"];
      const entryArgs = entryGlobs.map((g) => path.join(s.packageDir, g));
      const args = [
        "--tsconfig",
        s.tsconfigPath,
        "--skipErrorChecking",
        "--entryPointStrategy",
        "resolve",
        "--entryPoints",
        ...entryArgs,
        "--out",
        s.docsDir,
      ];
      return args;
    },
    async posthook(s) {
      const vol = new Volume();
      await copyDirectoryToVolume(s.docsDir, "/docs", vol);
      await fsp.rm(s.tempRoot, { recursive: true, force: true });
      return vol;
    },
  });
}

async function fetchPackageMetadata(packagename: string) {
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packagename)}`;
  const res = await fetch(registryUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata for ${packagename}: ${res.status} ${res.statusText}`);
  }

  const body = await res.json();
  const latest = body["dist-tags"]?.latest;
  const tarballUrl = body.versions?.[latest]?.dist?.tarball;
  if (!latest || !tarballUrl) {
    throw new Error(`Could not resolve tarball URL for ${packagename}`);
  }

  return { tarballUrl };
}

async function downloadAndExtractTarball(tarballUrl: string, destination: string) {
  const res = await fetch(tarballUrl);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download tarball: ${res.status} ${res.statusText}`);
  }

  await pipeline(
    Readable.fromWeb(res.body as any),
    createGunzip(),
    unpackTar(destination, { strip: 1 }),
  );
}

async function copyDirectoryToVolume(source: string, target: string, volume: Volume) {
  const entries = await fsp.readdir(source, { withFileTypes: true });
  await volume.promises.mkdir(target, { recursive: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryToVolume(sourcePath, targetPath, volume);
      continue;
    }

    if (entry.isFile()) {
      const content = await fsp.readFile(sourcePath);
      await volume.promises.writeFile(targetPath, content);
    }
  }
}

async function createLooseTsconfig(tsconfigPath: string) {
  const config = {
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      noEmit: true,
      skipLibCheck: true,
      allowArbitraryExtensions: true,
      module: "esnext",
      target: "esnext",
      moduleResolution: "bundler",
      verbatimModuleSyntax: true,
      allowImportingTsExtensions: true,
      jsx: "react-jsx",
      types: [],
    },
    include: ["./**/*"],
    exclude: ["./node_modules", "./**/*.test.*", "./**/*.spec.*"],
  };

  await fsp.writeFile(tsconfigPath, JSON.stringify(config, null, 2), "utf8");
}
