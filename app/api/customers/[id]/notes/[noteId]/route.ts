import { deleteNote, listNotes } from "@/lib/db";
import { json, notFound } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

export const DELETE = withMatchmaker<{ id: string; noteId: string }>(async (_request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const notes = await listNotes(params.id);
  if (!notes.some((n) => n.id === params.noteId)) throw notFound("Note not found");
  await deleteNote(params.id, params.noteId);
  return json({ ok: true });
});
