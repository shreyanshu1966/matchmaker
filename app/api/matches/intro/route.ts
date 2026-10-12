import { z } from "zod";
import { generateIntroEmail } from "@/lib/ai";
import { json, parseBody } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";
import { scoreCandidate } from "@/app/api/_lib/matches";

const IntroSchema = z.object({
  customerId: z.string().min(1),
  matchId: z.string().min(1),
  tone: z.enum(["Warm", "Formal", "Playful"]).default("Warm"),
});

export const POST = withMatchmaker(async (request, { session }) => {
  const { customerId, matchId, tone } = await parseBody(request, IntroSchema);
  const customer = await getAuthorizedCustomer(session, customerId);
  const match = await scoreCandidate(customer, matchId);
  const email = await generateIntroEmail(customer, match, { tone, matchmakerName: session.name });
  return json(email);
});
