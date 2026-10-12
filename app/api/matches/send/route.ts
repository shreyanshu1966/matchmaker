import { z } from "zod";
import { addMatchAction, getProfile, listMatchActions, updateClientStatus } from "@/lib/db";
import type { CustomerStatus } from "@/lib/types";
import { HttpError, json, parseBody } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";
import { scoreCandidate } from "@/app/api/_lib/matches";

const SendSchema = z.object({
  customerId: z.string().min(1),
  matchId: z.string().min(1),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Body is required").max(20000),
});

/** Statuses that come before "Match Sent" in the pipeline. */
const PRE_MATCH_STATUSES: CustomerStatus[] = ["New", "Onboarding", "Profile Verified", "Matching"];

export const POST = withMatchmaker(async (request, { session }) => {
  const { customerId, matchId, subject, body } = await parseBody(request, SendSchema);
  const customer = await getAuthorizedCustomer(session, customerId);

  const existing = await listMatchActions(customerId);
  if (existing.some((a) => a.matchId === matchId)) {
    throw new HttpError(409, "This match has already been sent to the customer");
  }

  const match = await scoreCandidate(customer, matchId);
  const action = await addMatchAction({
    customerId,
    matchId,
    matchName: `${match.candidate.firstName} ${match.candidate.lastName}`,
    score: match.finalScore,
    tier: match.tier,
    emailSubject: subject,
    emailBody: body,
    sentBy: session.name,
    outcome: "Pending",
  });

  // Mock send: nothing leaves the server, the action log is the record.
  console.info(`[mock-send] ${session.username} -> customer ${customerId} (match ${matchId}): "${subject}"`);

  const updated =
    customer.status && PRE_MATCH_STATUSES.includes(customer.status)
      ? await updateClientStatus(customerId, "Match Sent")
      : ((await getProfile(customerId)) ?? customer);

  return json({ action, customer: updated });
});
