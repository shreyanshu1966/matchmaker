/**
 * In-memory store backed by seed JSON plus a small JSON "delta" state file.
 * Swap this module for a Postgres implementation behind the same functions in ./index.ts.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { MatchAction, MatchOutcome, Matchmaker, Note, Profile } from "../types";

/** Mutations persisted on top of the seed data. */
export interface PersistedState {
  version: 1;
  profilePatches: Record<string, Partial<Pick<Profile, "status" | "lastActivityAt">>>;
  addedNotes: Note[];
  deletedNoteIds: string[];
  addedMatchActions: MatchAction[];
  matchActionPatches: Record<string, { outcome: MatchOutcome }>;
}

export interface Store {
  profiles: Map<string, Profile>;
  matchmakers: Matchmaker[];
  notes: Map<string, Note>;
  matchActions: Map<string, MatchAction>;
  state: PersistedState;
}

const SEED_DIR = () => path.join(process.cwd(), "data", "seed");

export function stateFilePath(): string {
  if (process.env.MATCHMAKER_STATE_FILE) return process.env.MATCHMAKER_STATE_FILE;
  if (process.env.VERCEL) return path.join(os.tmpdir(), "matchmaker-state.json");
  return path.join(process.cwd(), ".data", "state.json");
}

function emptyState(): PersistedState {
  return { version: 1, profilePatches: {}, addedNotes: [], deletedNoteIds: [], addedMatchActions: [], matchActionPatches: {} };
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

function readState(): PersistedState {
  const file = stateFilePath();
  try {
    const raw = readJson<Partial<PersistedState> | null>(file, null);
    if (!raw) return emptyState();
    return { ...emptyState(), ...raw, version: 1 };
  } catch (err) {
    console.error(`[db] Could not read state file ${file}, starting from seed:`, err);
    return emptyState();
  }
}

/** Atomic write: temp file + rename. */
export function persistState(state: PersistedState): void {
  const file = stateFilePath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state), "utf8");
    try {
      fs.renameSync(tmp, file);
    } catch {
      // Windows can refuse to replace a file that is briefly locked; fall back to a direct write.
      fs.writeFileSync(file, JSON.stringify(state), "utf8");
      fs.rmSync(tmp, { force: true });
    }
  } catch (err) {
    // Never crash a request because the filesystem is read-only; the in-memory state still works.
    console.error(`[db] Failed to persist state to ${file}:`, err);
  }
}

export function deleteStateFile(): void {
  try {
    fs.rmSync(stateFilePath(), { force: true });
  } catch (err) {
    console.error("[db] Failed to delete state file:", err);
  }
}

function buildStore(): Store {
  const dir = SEED_DIR();
  const profiles = readJson<Profile[]>(path.join(dir, "profiles.json"), []);
  const matchmakers = readJson<Matchmaker[]>(path.join(dir, "matchmakers.json"), []);
  const notes = readJson<Note[]>(path.join(dir, "notes.json"), []);
  const actions = readJson<MatchAction[]>(path.join(dir, "matchActions.json"), []);
  if (!profiles.length) console.warn(`[db] No seed profiles found in ${dir}. Run \`npm run seed\`.`);

  const state = readState();
  const store: Store = {
    profiles: new Map(profiles.map((p) => [p.id, p])),
    matchmakers,
    notes: new Map(notes.map((n) => [n.id, n])),
    matchActions: new Map(actions.map((a) => [a.id, a])),
    state,
  };

  // merge persisted state over the seed
  for (const [id, patch] of Object.entries(state.profilePatches)) {
    const p = store.profiles.get(id);
    if (p) store.profiles.set(id, { ...p, ...patch });
  }
  for (const n of state.addedNotes) store.notes.set(n.id, n);
  for (const id of state.deletedNoteIds) store.notes.delete(id);
  for (const a of state.addedMatchActions) store.matchActions.set(a.id, a);
  for (const [id, patch] of Object.entries(state.matchActionPatches)) {
    const a = store.matchActions.get(id);
    if (a) store.matchActions.set(id, { ...a, ...patch });
  }
  return store;
}

const g = globalThis as unknown as { __matchmakerStore?: Store };

/** Module-level store cached on globalThis so it survives Next dev hot reloads. */
export function getStore(): Store {
  if (!g.__matchmakerStore) g.__matchmakerStore = buildStore();
  return g.__matchmakerStore;
}

export function resetStore(): Store {
  deleteStateFile();
  g.__matchmakerStore = buildStore();
  return g.__matchmakerStore;
}
