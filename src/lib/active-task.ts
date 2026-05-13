// Shared active-task state (persisted in localStorage so dashboard preview
// and /user/tasks page stay in sync across tab/page navigations).
const KEY = "ct_active_task_v1";
export const REQUIRED_SECONDS = 30;

export type ActiveTask = {
  id: number;
  startedAt: number;   // ms
  awayMs: number;      // accumulated milliseconds the user spent away (ad viewing)
  needsAway: boolean;  // true for url-based ads — must blur this tab
};

export function readActive(): ActiveTask | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ActiveTask;
    if (!v || typeof v.id !== "number") return null;
    return v;
  } catch { return null; }
}

export function writeActive(a: ActiveTask | null) {
  if (typeof window === "undefined") return;
  try {
    if (a == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(a));
    // notify listeners (same-tab; storage event fires only across tabs)
    window.dispatchEvent(new Event("ct:active-task"));
  } catch {}
}

export function clearActive() { writeActive(null); }

/** Effective viewed seconds — for url-tasks counts only the awayMs;
 *  for non-url tasks counts wall-clock seconds since startedAt. */
export function viewedSeconds(a: ActiveTask): number {
  if (a.needsAway) return Math.min(REQUIRED_SECONDS, Math.floor(a.awayMs / 1000));
  return Math.min(REQUIRED_SECONDS, Math.floor((Date.now() - a.startedAt) / 1000));
}
