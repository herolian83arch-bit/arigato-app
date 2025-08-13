import * as crypto from "crypto";

export const PICK_KEYS = ["id","sceneId","scene","main","romaji","description"] as const;

export function pick(obj: any, keys: readonly string[]) {
  const out: any = {};
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

export function deepSortKeys<T = any>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => deepSortKeys(v)) as any;
  const sorted: any = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = deepSortKeys((obj as any)[k]);
  return sorted;
}

export function sha256(str: string): string {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

export function normalizePickedForHash(arr: any[]): string {
  const picked = arr.map((e) => pick(e, PICK_KEYS));
  const normalized = deepSortKeys(picked);
  return JSON.stringify(normalized);
}
