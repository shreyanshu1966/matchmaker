import { z } from "zod";
import { updateClientStatus } from "@/lib/db";
import { CUSTOMER_STATUSES, type CustomerStatus } from "@/lib/types";
import { json, parseBody } from "@/lib/auth/http";
import { getAuthorizedCustomer, withMatchmaker } from "@/lib/auth/guard";

const PatchSchema = z.object({
  status: z.enum(CUSTOMER_STATUSES as [CustomerStatus, ...CustomerStatus[]]),
});

export const GET = withMatchmaker<{ id: string }>(async (_request, { session, params }) => {
  const customer = await getAuthorizedCustomer(session, params.id);
  return json({ customer });
});

export const PATCH = withMatchmaker<{ id: string }>(async (request, { session, params }) => {
  await getAuthorizedCustomer(session, params.id);
  const { status } = await parseBody(request, PatchSchema);
  const customer = await updateClientStatus(params.id, status);
  return json({ customer });
});
