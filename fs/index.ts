import { Volume, createFsFromVolume } from 'memfs';
import type { IFs } from 'memfs';
import * as snapshot from "../snapshot.ts";

const vol = new Volume();
const fs: IFs = createFsFromVolume(vol);
await snapshot.load(fs);

export const promises = fs.promises;

export const {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
  mkdir,
  mkdirSync,
  rmdir,
  rmdirSync,
  stat,
  statSync,
  exists,
  existsSync,
  readdir,
  readdirSync,
  unlink,
  unlinkSync,
  rename,
  renameSync,
  constants,
  createReadStream,
  createWriteStream,
  watch,
  watchFile,
  unwatchFile,
} = fs;

export default fs;
