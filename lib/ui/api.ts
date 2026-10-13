/**
 * Tiny client-side fetch wrapper for the TDC Matchmaker HTTP API (CONTRACTS.md section 4).
 * - Sends/parses JSON
 * - Throws ApiError with the server's `{ error }` message
 * - On 401 (outside the login call) redirects to /login?next=<current path>
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
  /** Set false to handle 401 yourself (e.g. the login form). Default true. */
  redirectOn401?: boolean;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname.startsWith("/login")) return;
  const next = encodeURIComponent(pathname + search);
  // Hard navigation on purpose: drops all client state of the expired session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${next}`);
}

async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, signal, redirectOn401 = true } = opts;
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      signal,
      credentials: "same-origin",
      cache: "no-store",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && redirectOn401) redirectToLogin();
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : res.status === 404
          ? "Not found."
          : `Something went wrong (${res.status}).`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...opts, body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>("DELETE", path, opts),
};

/** Human-friendly message for any thrown value. */
export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}
