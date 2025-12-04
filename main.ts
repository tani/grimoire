import mock from "mock-fs";
import path from "path";
import { execTypeDoc } from "./typedoc.ts";

export async function execTypeDocVirtually(...args: string[]) {
    try {
      mock({ 'node_modules': mock.load(path.resolve(__dirname, 'node_modules')) });
      await execTypeDoc(...args);
    } finally {
      mock.restore();
    }
}
