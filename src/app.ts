import path from "node:path";
import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import type { Volume } from "memfs";
import { LRUCache } from "lru-cache";
import { npmdoc } from "./npmdoc.ts";
import indexHtml from "./indexHtml.ts";

const docsCache = new LRUCache<string, Promise<Volume>>({
  max: 32,
});
const app = new Hono();

const ensureGrimoireHomeLink: MiddlewareHandler = async (c, next) => {
  await next();

  const res = c.res;
  const contentType = res?.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("text/html")) {
    return;
  }

  const html = await res.text();
  const rewritten = addGrimoireHomeLink(html);
  const headers = new Headers(res.headers);
  headers.set("content-length", Buffer.byteLength(rewritten, "utf8").toString());
  c.res = new Response(rewritten, {
    status: res.status,
    headers,
  });
};

app.get("/", (c) => {
  const html = indexHtml;
  return c.html(html);
});

app.get("/favicon.ico", (c) => c.body(null, 204));

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
    const body = toArrayBuffer(content);
    return new Response(body, {
      status: 200,
      headers: { "content-type": contentType(filePath) },
    });
  } catch (err) {
    if (isNotFound(err)) {
      console.warn(err);
      return c.text("Not found", 404);
    }
    console.error(err);
    return c.text("Internal Server Error", 500);
  }
};

app.use("/:package/", ensureGrimoireHomeLink);
app.use("/:package/*", ensureGrimoireHomeLink);
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

async function readFromVolume(
  volume: Volume,
  requestPath: string,
): Promise<{
  content: Buffer;
  filePath: string;
}> {
  const stat = await volume.promises.stat(requestPath).catch(() => undefined);
  const filePath = stat?.isDirectory() ? path.posix.join(requestPath, "index.html") : requestPath;
  const content = (await volume.promises.readFile(filePath)) as Buffer;
  return { content, filePath };
}

function toArrayBuffer(buf: Buffer | Uint8Array): ArrayBuffer {
  const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
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

function addGrimoireHomeLink(html: string): string {
  const anchorRegex = /(<a\b[^>]*\bclass="[^"]*\btitle\b[^"]*"[^>]*>[\s\S]*?<\/a>)/i;
  if (html.includes('<a class="title" href="/">Grimoire</a>')) {
    return html;
  }
  return html.replace(anchorRegex, (match) => {
    const homeLink = '<a class="title" href="/">Grimoire</a>';
    return `${homeLink}${match}`;
  });
}
