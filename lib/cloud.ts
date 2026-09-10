const KEYS = ["pa-progress-v1", "pa-quiz-v1", "pa-recruit-v1"] as const;

let authed = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function setAuthed(v: boolean) {
  authed = v;
}

function getLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocal(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

function safeParse(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asMap(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** 合并云端与本地：对象型按布尔字段并集，投递数组按 id 去重（本地优先） */
function mergeBlob(
  key: string,
  cloudRaw: string | null | undefined,
  localRaw: string | null
): string | null {
  if (key === "pa-recruit-v1") {
    const cloud = Array.isArray(safeParse(cloudRaw)) ? (safeParse(cloudRaw) as any[]) : [];
    const local = Array.isArray(safeParse(localRaw)) ? (safeParse(localRaw) as any[]) : [];
    const map = new Map<string, unknown>();
    for (const it of cloud) if (it && it.id) map.set(it.id, it);
    for (const it of local) if (it && it.id) map.set(it.id, it);
    return JSON.stringify([...map.values()]);
  }

  const cloud = asMap(safeParse(cloudRaw));
  const local = asMap(safeParse(localRaw));
  const out: Record<string, Record<string, boolean>> = {};
  const fields = new Set([...Object.keys(cloud), ...Object.keys(local)]);
  for (const f of fields) {
    const c = asMap(cloud[f]);
    const l = asMap(local[f]);
    const merged: Record<string, boolean> = {};
    for (const k of new Set([...Object.keys(c), ...Object.keys(l)])) {
      merged[k] = !!(c[k] || l[k]);
    }
    out[f] = merged;
  }
  return JSON.stringify(out);
}

export async function pushAll(): Promise<boolean> {
  const body: Record<string, string> = {};
  for (const k of KEYS) {
    const v = getLocal(k);
    if (v) body[k] = v;
  }
  try {
    const r = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function pullAll(): Promise<boolean> {
  try {
    const r = await fetch("/api/sync");
    if (!r.ok) return false;
    const data = await r.json();
    for (const k of KEYS) {
      const merged = mergeBlob(k, data[k], getLocal(k));
      if (merged) setLocal(k, merged);
    }
    // 通知各模块重读本地数据，无需整页刷新
    window.dispatchEvent(new Event("pa-sync"));
    return true;
  } catch {
    return false;
  }
}

/** 登录状态下，数据变更后防抖自动推送到云端 */
export function schedulePush() {
  if (!authed) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void pushAll();
  }, 1500);
}
