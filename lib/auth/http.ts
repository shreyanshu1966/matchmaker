import { unstable_rethrow } from "next/navigation";
/** Small JSON/error helpers shared by all API route handlers. */
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json<T>(data: T, init?: number | ResponseInit): Response {
  const responseInit: ResponseInit = typeof init === "number" ? { status: init } : (init ?? {});
  const headers = new Headers(responseInit.headers);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...responseInit, headers });
}

export function errorResponse(status: number, message: string): Response {
  return json({ error: message }, status);
}

export const badRequest = (message = "Bad request") => new HttpError(400, message);
export const notFound = (message = "Not found") => new HttpError(404, message);

export function toErrorResponse(err: unknown): Response {
  // Let Next.js internal control-flow errors (e.g. prerender bail-out on cookies()) propagate.
  unstable_rethrow(err);
  if (err instanceof HttpError) return errorResponse(err.status, err.message);
  console.error("[api] Unhandled error:", err);
  return errorResponse(500, "Internal server error");
}

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request";
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest(formatZodError(result.error));
  return result.data;
}

/** Reads the JSON body and validates it. Throws HttpError(400) on bad JSON or validation failure. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  return parseWith(schema, raw);
}
