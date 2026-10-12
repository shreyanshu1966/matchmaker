/**
 * Sanity check for lib/db. Uses a throwaway state file.
 *   npx tsx scripts/check-db.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

const stateFile = path.join(os.tmpdir(), `matchmaker-check-${process.pid}.json`);
process.env.MATCHMAKER_STATE_FILE = stateFile;

async function main() {
  const db = await import("../lib/db");
  await db.resetDemoData();

  const priya = await db.getMatchmakerByUsername("priya");
  assert.ok(priya && priya.id === "mm_priya" && priya.name === "Priya Sharma");
  assert.ok(await bcrypt.compare("demo123", priya.passwordHash));
  assert.equal((await db.getMatchmakerById("mm_arjun"))?.username, "arjun");
  assert.equal(await db.getMatchmakerByUsername("nobody"), null);

  const pc = await db.listClients("mm_priya");
  const ac = await db.listClients("mm_arjun");
  assert.equal(pc.length, 10);
  assert.equal(ac.length, 10);
  assert.equal((await db.listPool("Female")).length, 160);
  assert.equal((await db.listPool("Male")).length, 160);
  assert.equal(await db.getProfile("nope"), null);

  const c = pc[0];
  const notesBefore = await db.listNotes(c.id);
  assert.ok(notesBefore.length >= 2);
  assert.ok(notesBefore[0].createdAt >= notesBefore[notesBefore.length - 1].createdAt, "notes newest first");

  const updated = await db.updateClientStatus(c.id, "Matching");
  assert.equal(updated.status, "Matching");
  assert.ok(updated.lastActivityAt > c.lastActivityAt);

  const note = await db.addNote({ customerId: c.id, authorId: "mm_priya", authorName: "Priya Sharma", type: "Call", body: "Test note" });
  assert.equal((await db.listNotes(c.id))[0].id, note.id);
  await db.deleteNote(c.id, notesBefore[0].id);
  assert.equal((await db.listNotes(c.id)).length, notesBefore.length);
  await assert.rejects(db.deleteNote(c.id, "missing"), /Not found/);
  await assert.rejects(db.updateClientStatus("p_f_001", "New"), /Not found/);

  const ma = await db.addMatchAction({ customerId: c.id, matchId: "p_m_001", matchName: "X", score: 80, tier: "High Potential", emailSubject: "s", emailBody: "b", sentBy: "Priya Sharma", outcome: "Pending" });
  const ma2 = await db.updateMatchOutcome(c.id, ma.id, "Accepted");
  assert.equal(ma2.outcome, "Accepted");
  const seeded = await db.listMatchActions("c_005");
  assert.equal(seeded.length, 2);
  await db.updateMatchOutcome("c_005", seeded[0].id, "Declined");
  await assert.rejects(db.updateMatchOutcome("c_006", seeded[0].id, "Met"), /Not found/);

  // persistence: drop the in-memory cache and reload from seed + state file
  assert.ok(fs.existsSync(stateFile));
  delete (globalThis as { __matchmakerStore?: unknown }).__matchmakerStore;
  assert.equal((await db.getProfile(c.id))?.status, "Matching");
  const reloaded = await db.listNotes(c.id);
  assert.equal(reloaded[0].id, note.id);
  assert.ok(!reloaded.some((n) => n.id === notesBefore[0].id));
  assert.equal((await db.listMatchActions(c.id))[0].outcome, "Accepted");
  assert.equal((await db.listMatchActions("c_005")).find((a) => a.id === seeded[0].id)?.outcome, "Declined");

  // returned objects are copies
  const p1 = await db.getProfile(c.id);
  p1!.firstName = "Mutated";
  assert.notEqual((await db.getProfile(c.id))?.firstName, "Mutated");

  await db.resetDemoData();
  assert.ok(!fs.existsSync(stateFile));
  assert.equal((await db.getProfile(c.id))?.status, c.status);
  assert.equal((await db.listNotes(c.id)).length, notesBefore.length);

  console.log("check-db: all assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
