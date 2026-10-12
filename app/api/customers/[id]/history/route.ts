import { listMatchActions } from "@/lib/db";
import { json } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

export const GET = withMatchmaker<{ id: string }>(async (_request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const actions = await listMatchActions(params.id);
  return json({ actions });
});
