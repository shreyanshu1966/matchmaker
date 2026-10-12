import { listClients } from "@/lib/db";
import { json } from "@/lib/auth/http";
import { withMatchmaker } from "@/lib/auth/guard";

export const GET = withMatchmaker(async (_request, { session }) => {
  const customers = await listClients(session.id);
  return json({ customers });
});
