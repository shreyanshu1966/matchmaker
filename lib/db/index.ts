/**
 * Data access layer (server-only). All functions are async so a Postgres
 * implementation can replace the JSON/in-memory store without changing callers.
 */
import { randomUUID } from "node:crypto";
import type { CustomerStatus, Gender, MatchAction, MatchOutcome, Matchmaker, Note, Profile } from "../types";
import { getStore, persistState, resetStore } from "./store";

const clone = <T,>(x: T): T => structuredClone(x);
const notFound = () => new Error("Not found");
const byNewest = (a: string, b: string) => b.localeCompare(a);

function touchCustomer(customerId: string, at: string): Profile {
  const store = getStore();
  const p = store.profiles.get(customerId);
  if (!p) throw notFound();
  const updated = { ...p, lastActivityAt: at };
  store.profiles.set(customerId, updated);
  store.state.profilePatches[customerId] = { ...store.state.profilePatches[customerId], lastActivityAt: at };
  return updated;
}

function requireClient(id: string): Profile {
  const p = getStore().profiles.get(id);
  if (!p || !p.isClient) throw notFound();
  return p;
}

// ---------------- matchmakers ----------------

export async function getMatchmakerByUsername(username: string): Promise<Matchmaker | null> {
  const u = username.trim().toLowerCase();
  const m = getStore().matchmakers.find((x) => x.username.toLowerCase() === u);
  return m ? clone(m) : null;
}

export async function getMatchmakerById(id: string): Promise<Matchmaker | null> {
  const m = getStore().matchmakers.find((x) => x.id === id);
  return m ? clone(m) : null;
}

// ---------------- profiles ----------------

export async function listClients(matchmakerId: string): Promise<Profile[]> {
  return [...getStore().profiles.values()]
    .filter((p) => p.isClient && p.assignedTo === matchmakerId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(clone);
}

export async function getProfile(id: string): Promise<Profile | null> {
  const p = getStore().profiles.get(id);
  return p ? clone(p) : null;
}

export async function listPool(gender: Gender): Promise<Profile[]> {
  return [...getStore().profiles.values()].filter((p) => !p.isClient && p.gender === gender).map(clone);
}

export async function updateClientStatus(id: string, status: CustomerStatus): Promise<Profile> {
  const store = getStore();
  requireClient(id);
  const now = new Date().toISOString();
  const updated = { ...store.profiles.get(id)!, status, lastActivityAt: now };
  store.profiles.set(id, updated);
  store.state.profilePatches[id] = { ...store.state.profilePatches[id], status, lastActivityAt: now };
  persistState(store.state);
  return clone(updated);
}

// ---------------- notes ----------------

export async function listNotes(customerId: string): Promise<Note[]> {
  return [...getStore().notes.values()]
    .filter((n) => n.customerId === customerId)
    .sort((a, b) => byNewest(a.createdAt, b.createdAt))
    .map(clone);
}

export async function addNote(note: Omit<Note, "id" | "createdAt">): Promise<Note> {
  const store = getStore();
  requireClient(note.customerId);
  const created: Note = { ...note, id: randomUUID(), createdAt: new Date().toISOString() };
  store.notes.set(created.id, created);
  store.state.addedNotes.push(created);
  touchCustomer(note.customerId, created.createdAt);
  persistState(store.state);
  return clone(created);
}

export async function deleteNote(customerId: string, noteId: string): Promise<void> {
  const store = getStore();
  const n = store.notes.get(noteId);
  if (!n || n.customerId !== customerId) throw notFound();
  store.notes.delete(noteId);
  const idx = store.state.addedNotes.findIndex((x) => x.id === noteId);
  if (idx >= 0) store.state.addedNotes.splice(idx, 1);
  else store.state.deletedNoteIds.push(noteId);
  persistState(store.state);
}

// ---------------- match actions ----------------

export async function listMatchActions(customerId: string): Promise<MatchAction[]> {
  return [...getStore().matchActions.values()]
    .filter((a) => a.customerId === customerId)
    .sort((a, b) => byNewest(a.sentAt, b.sentAt))
    .map(clone);
}

export async function addMatchAction(a: Omit<MatchAction, "id" | "sentAt">): Promise<MatchAction> {
  const store = getStore();
  requireClient(a.customerId);
  const created: MatchAction = { ...a, id: randomUUID(), sentAt: new Date().toISOString() };
  store.matchActions.set(created.id, created);
  store.state.addedMatchActions.push(created);
  touchCustomer(a.customerId, created.sentAt);
  persistState(store.state);
  return clone(created);
}

export async function updateMatchOutcome(customerId: string, actionId: string, outcome: MatchOutcome): Promise<MatchAction> {
  const store = getStore();
  const a = store.matchActions.get(actionId);
  if (!a || a.customerId !== customerId) throw notFound();
  const updated = { ...a, outcome };
  store.matchActions.set(actionId, updated);
  const added = store.state.addedMatchActions.find((x) => x.id === actionId);
  if (added) added.outcome = outcome;
  else store.state.matchActionPatches[actionId] = { outcome };
  touchCustomer(customerId, new Date().toISOString());
  persistState(store.state);
  return clone(updated);
}

// ---------------- demo ----------------

export async function resetDemoData(): Promise<void> {
  resetStore();
}
