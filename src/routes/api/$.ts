import { createFileRoute } from "@tanstack/react-router";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const LOCAL_API_ORIGINS = new Set(["http://localhost:3001", "http://127.0.0.1:3001"]);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxyApiRequest,
      POST: proxyApiRequest,
      PUT: proxyApiRequest,
      PATCH: proxyApiRequest,
      DELETE: proxyApiRequest,
      OPTIONS: proxyApiRequest,
    },
  },
});

function getBackendOrigin() {
  return (process.env.API_ORIGIN || process.env.VITE_API_URL || "https://clicktaka24.com").replace(/\/$/, "");
}

function fallbackOrigin(request: Request) {
  const incomingUrl = new URL(request.url);
  return `${incomingUrl.protocol}//${incomingUrl.host}`;
}

function copyRequestHeaders(request: Request) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower)) headers.set(key, value);
  });
  return headers;
}

function copyResponseHeaders(response: Response) {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") {
      headers.append("set-cookie", value.replace(/;\s*Domain=[^;]+/gi, ""));
      return;
    }
    if (!HOP_BY_HOP_HEADERS.has(lower)) headers.set(key, value);
  });
  return headers;
}

async function proxyApiRequest({ request, params }: { request: Request; params: { _splat?: string } }) {
  const incomingUrl = new URL(request.url);
  const backendOrigin = getBackendOrigin();
  const backendUrl = new URL(`/api/${params._splat ?? ""}${incomingUrl.search}`, backendOrigin);
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  if (LOCAL_API_ORIGINS.has(backendOrigin) && incomingUrl.origin !== backendOrigin) {
    return Response.redirect(new URL(`/api/${params._splat ?? ""}${incomingUrl.search}`, fallbackOrigin(request)), 307);
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: copyRequestHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: copyResponseHeaders(response),
    });
  } catch (error) {
    console.error("API proxy failed", error);
    return Response.json(
      { error: "API server unreachable. Please try again shortly." },
      { status: 502 },
    );
  }
}
