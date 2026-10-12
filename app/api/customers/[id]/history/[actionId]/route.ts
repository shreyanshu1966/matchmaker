import { z } from "zod";
import { listMatchActions, updateMatchOutcome } from "@/lib/db";
import { json, notFound, parseBody } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

const OutcomeSchema = z.object({
  outcome: z.enum(["Pending", "Accepted", "Declined", "Met"]),
});

export const PATCH = withMatchmaker<{ id: string; actionId: string }>(async (request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const { outcome } = await parseBody(request, OutcomeSchema);
  const actions = await listMatchActions(params.id);
  if (!actions.some((a) => a.id === params.actionId)) throw notFound("Match action not found");
  const action = await updateMatchOutcome(params.id, params.actionId, outcome);
  return json({ action });
});
