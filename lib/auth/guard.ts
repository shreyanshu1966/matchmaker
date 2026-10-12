/** Auth + ownership guards for API route handlers. */
import type { NextRequest } from "next/server";
import { getProfile } from "@/lib/db";
import type { Profile } from "@/lib/types";
import { getSession, type Session } from "./session";
import { errorResponse, notFound, toErrorResponse } from "./http";

type Params = Record<string, string | string[] | undefined>;

export interface RouteArgs<P extends Params> {
  session: Session;
  params: P;
}

/**
 * Wraps a route handler: requires a valid session (401 otherwise), awaits the
 * `params` promise and converts thrown HttpErrors / unknown errors to JSON.
 */
export function withMatchmaker<P extends Params = Record<string, never>>(
  handler: (request: NextRequest, args: RouteArgs<P>) => Promise<Response>
) {
  return async (request: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    try {
      const session = await getSession();
      if (!session) return errorResponse(401, "Not authenticated");
      const params = ((await context?.params) ?? {}) as P;
      return await handler(request, { session, params });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Wraps a public route handler with the same error handling (no session required). */
export function withErrors(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      return await handler(request);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/**
 * Loads a client profile and checks it is assigned to the session matchmaker.
 * Throws HttpError(404) otherwise, so other matchmakers' clients are indistinguishable from missing ones.
 */
export async function getAuthorizedCustomer(session: Session, customerId: string): Promise<Profile> {
  const customer = await getProfile(customerId);
  if (!customer || !customer.isClient || customer.assignedTo !== session.id) {
    throw notFound("Customer not found");
  }
  return customer;
}
