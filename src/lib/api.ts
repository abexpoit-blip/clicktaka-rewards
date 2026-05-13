// API client — VPS-এ deploy হলে same-origin /api/* ব্যবহার হবে
// Lovable preview থেকে test করতে চাইলে .env.local-এ VITE_API_URL=https://clicktaka24.com বসান
const BASE = import.meta.env.VITE_API_URL || '';

export async function api<T = any>(
  path: string,
  opts: RequestInit & { json?: any } = {}
): Promise<T> {
  const { json, headers, ...rest } = opts;
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : opts.body,
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}
