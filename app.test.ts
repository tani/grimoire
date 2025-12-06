import { app } from "./app.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("test for markdown-it docs", async () => {
  const res = await app.request("/commonmark/index.html");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /commonmark/);
});
