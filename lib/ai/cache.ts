/**
 * Tiny in-memory LRU cache stored on globalThis so it survives Next.js dev
 * hot reloads. Keys are sha256 hashes of the (redacted) inputs plus the model.
 * Only successful LLM results are cached; fallbacks are cheap to recompute.
 */
import { createHash } from "node:crypto";

const MAX_ENTRIES = 500;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface Entry {
  value: unknown;
  expiresAt: number;
}

const g = globalThis as typeof globalThis & { __mmAiCache?: Map<string, Entry> };

function store(): Map<string, Entry> {
  if (!g.__mmAiCache) g.__mmAiCache = new Map();
  return g.__mmAiCache;
}

export function hashKey(...parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

export function cacheGet<T>(key: string): T | undefined {
  const map = store();
  const entry = map.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    map.delete(key);
    return undefined;
  }
  // refresh recency
  map.delete(key);
  map.set(key, entry);
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  const map = store();
  map.delete(key);
  map.set(key, { value, expiresAt: Date.now() + TTL_MS });
  while (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

export function cacheClear(): void {
  store().clear();
}
