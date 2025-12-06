import fs from "./index.ts";

export default fs.promises;

export const {
  access,
  copyFile,
  open,
  opendir,
  rename,
  truncate,
  rm,
  rmdir,
  mkdir,
  readdir,
  readlink,
  symlink,
  lstat,
  stat,
  link,
  unlink,
  chmod,
  lchmod,
  lchown,
  chown,
  utimes,
  realpath,
  mkdtemp,
  writeFile,
  appendFile,
  readFile,
  watch,
  constants,
} = fs.promises;
