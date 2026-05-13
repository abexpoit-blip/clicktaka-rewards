// Production Node server for the TanStack Start worker bundle.
// Serves dist/client/* as static assets and proxies everything else
// to the Worker-style handler exported from dist/server/index.js.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLIENT_DIR = join(ROOT, "dist", "client");
const SERVER_ENTRY = join(ROOT, "dist", "server", "index.js");

const PORT = Number(process.env.PORT) || 3002;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const handlerMod = await import(SERVER_ENTRY);
const handler = handlerMod.default ?? handlerMod;
if (typeof handler?.fetch !== "function") {
  throw new Error("Server bundle does not export a default { fetch } handler");
}

async function tryStatic(pathname) {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return null;
  // Block path traversal
  if (pathname.includes("..")) return null;
  const filePath = join(CLIENT_DIR, pathname);
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return null;
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    return { data, type };
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Try to serve a real static file from dist/client first (assets, favicon, etc.)
    const file = await tryStatic(url.pathname);
    if (file) {
      const cache = url.pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600";
      res.writeHead(200, { "content-type": file.type, "cache-control": cache });
      res.end(file.data);
      return;
    }

    // Otherwise hand off to the SSR worker handler
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, String(x)));
      else headers.set(k, String(v));
    }

    const method = (req.method || "GET").toUpperCase();
    let body;
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      body = chunks.length ? Buffer.concat(chunks) : undefined;
    }

    const request = new Request(url.toString(), { method, headers, body, duplex: "half" });
    const response = await handler.fetch(request, {}, {});

    const resHeaders = {};
    response.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    res.writeHead(response.status, resHeaders);

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (err) {
    console.error("[node-server] error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`✓ ClickTaka Web on http://${HOST}:${PORT}`);
});
