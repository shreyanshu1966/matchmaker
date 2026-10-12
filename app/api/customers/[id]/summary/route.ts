import { listNotes } from "@/lib/db";
import { summarizeNotes } from "@/lib/ai";
import { json } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

export const POST = withMatchmaker<{ id: string }>(async (_request, { session, params }) => {
  const customer = await getAuthorizedCustomer(session, params.id);
  const notes = await listNotes(params.id);
  const summary = await summarizeNotes(customer, notes);
  return json(summary);
});
