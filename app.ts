import path from "node:path";
import { Hono } from "hono";
import type { Context } from "hono";
import type { Volume } from "memfs";
import { npmdoc } from "./npmdoc.ts";
import { serve } from "@hono/node-server";

const docsCache = new Map<string, Promise<Volume>>();
const app = new Hono();

app.get("/", (c) => {
  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>jsdoc</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; }
      form { display: flex; gap: .5rem; flex-wrap: wrap; }
      input[type="text"] { flex: 1 0 12rem; padding: .5rem; font-size: 1rem; }
      button { padding: .5rem 1rem; font-size: 1rem; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Generate npm docs</h1>
    <form action="/" method="get" onsubmit="event.preventDefault(); window.location.href='/' + encodeURIComponent(document.querySelector('input[name=package]').value) + '/';">
      <input type="text" name="package" placeholder="package-name" required />
      <button type="submit">Open docs</button>
    </form>
  </body>
</html>`;
  return c.html(html);
});

app.get("/favicon.ico", (c) => c.text("", 204));

app.get("/:package", (c) => {
  const pkg = c.req.param("package");
  return c.redirect(`/${encodeURIComponent(pkg)}/`);
});

const serveDocs = async (c: Context) => {
  const pkg = c.req.param("package");
  const wildcard = extractSubpath(c, pkg);

  try {
    const volume = await loadDocs(pkg);
    const requestPath = resolveRequestPath(wildcard);
    const { content, filePath } = await readFromVolume(volume, requestPath);
    return c.newResponse(content, {
      status: 200,
      headers: { "content-type": contentType(filePath) },
    });
  } catch (err) {
    if (isNotFound(err)) {
      return c.text("Not found", 404);
    }
    console.error(err);
    return c.text("Internal Server Error", 500);
  }
};

app.get("/:package/", serveDocs);
app.get("/:package/*", serveDocs);

export { app };
export default app;

function loadDocs(packageName: string): Promise<Volume> {
  const cached = docsCache.get(packageName);
  if (cached) {
    return cached;
  }
  const promise = npmdoc(packageName);
  docsCache.set(packageName, promise);
  return promise;
}

function resolveRequestPath(wildcard: string): string {
  const stripped = wildcard.replace(/^\/+/, "");
  const base = stripped.length === 0 ? "/docs/index.html" : path.posix.join("/docs", stripped);
  const normalized = path.posix.normalize(base);
  if (normalized === "/docs") {
    return "/docs/index.html";
  }
  if (!normalized.startsWith("/docs/")) {
    const err: { code: string } = { code: "ENOENT" };
    throw err;
  }
  return normalized;
}

async function readFromVolume(volume: Volume, requestPath: string) {
  const stat = await volume.promises.stat(requestPath).catch(() => undefined);
  const filePath = stat?.isDirectory()
    ? path.posix.join(requestPath, "index.html")
    : requestPath;
  const content = await volume.promises.readFile(filePath);
  return { content, filePath };
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const lookup: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json; charset=utf-8",
  };
  return lookup[ext] ?? "application/octet-stream";
}

function extractSubpath(c: Context, pkg: string): string {
  const pathName = c.req.path;
  const prefix = `/${pkg}`;
  if (!pathName.startsWith(prefix)) {
    return "";
  }
  const rest = pathName.slice(prefix.length);
  return rest.replace(/^\//, "");
}

function isNotFound(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: unknown }).code === "ENOENT",
  );
}

serve(app)
