import test from "node:test";
import assert from "node:assert/strict";
import { npmdoc } from "./npmdoc.ts";

test("marked", async () => {
  const docs = await npmdoc("marked");
  const html = (await docs.promises.readFile("/docs/index.html", "utf8")) as string;
  assert.match(html!, /<!DOCTYPE html>/);
});

test("eslint -> markdown-it", async () => {
  await assert.rejects(() => npmdoc("eslint"));
  const docs = await npmdoc("markdown-it");
  const html = (await docs.promises.readFile("/docs/index.html", "utf8")) as string;
  assert.match(html!, /<!DOCTYPE html>/);
});
