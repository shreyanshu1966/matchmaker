import { z } from "zod";
import { addNote, listNotes } from "@/lib/db";
import { json, parseBody } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

const NoteSchema = z.object({
  type: z.enum(["Call", "Meeting", "General"]),
  body: z.string().trim().min(1, "Note cannot be empty").max(5000),
});

export const GET = withMatchmaker<{ id: string }>(async (_request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const notes = await listNotes(params.id);
  return json({ notes });
});

export const POST = withMatchmaker<{ id: string }>(async (request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const { type, body } = await parseBody(request, NoteSchema);
  const note = await addNote({
    customerId: params.id,
    authorId: session.id,
    authorName: session.name,
    type,
    body,
  });
  return json({ note }, 201);
});
