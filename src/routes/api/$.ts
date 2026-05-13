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
