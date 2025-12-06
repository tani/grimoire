import fsp from "fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { unpackTar } from "modern-tar/fs";
import { Volume } from "memfs";
import { typedoc } from "./typedoc.ts";

export async function npmdoc(packagename: string) {
  return await typedoc({
    async prehook() {
      const packageDir = "/package";
      await fsp.mkdir(packageDir, { recursive: true });

      const { tarballUrl } = await fetchPackageMetadata(packagename);
      await downloadAndExtractTarball(tarballUrl, packageDir);

      const docsDir = "/docs";

      return {
        packageDir,
        docsDir,
      };
    },
    createCliArgs(s) {
      const args = [
        `${s.packageDir}/**/*.{js,jsx,ts,tsx}`,
        "--out",
        s.docsDir,
      ];
      return args;
    },
    async posthook(s) {
      const vol = new Volume();
      await copyDirectoryToVolume(s.docsDir, "/docs", vol);
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
