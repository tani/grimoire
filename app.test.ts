import { app } from "./app.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("test for markdown-it docs", async () => {
  const res = await app.request("/markdown-it/index.html");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /markdown-it/);
});
