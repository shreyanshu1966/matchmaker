import { json } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";
import { computeMatches } from "@/app/api/_lib/matches";

export const GET = withMatchmaker<{ id: string }>(async (request, { session, params }) => {
  const customer = await getAuthorizedCustomer(session, params.id);
  const aiParam = request.nextUrl.searchParams.get("ai");
  const ai = aiParam === "1" || aiParam === "true";
  const result = await computeMatches(customer, { ai });
  return json(result);
});
