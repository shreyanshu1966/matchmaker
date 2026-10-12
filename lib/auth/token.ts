/**
 * JWT helpers for the session cookie. Pure jose + Web Crypto, with no
 * `next/headers` import, so both `proxy.ts` and server code can use it.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  name: string;
  username: string;
}

const DEV_SECRET = "dev-only-insecure-secret-change-me-in-production-0123456789";
let warned = false;
let cachedKey: Uint8Array | null = null;

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  let secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && !warned) {
      warned = true;
      console.warn(
        "[auth] AUTH_SECRET is not set; using the insecure development secret. Set AUTH_SECRET in production."
      );
    }
    secret = DEV_SECRET;
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

/** Returns the session user, or null for a missing, invalid or expired token. */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.name !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { id: payload.sub, name: payload.name, username: payload.username };
  } catch {
    return null;
  }
}
