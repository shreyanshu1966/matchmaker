/**
 * Optimistic auth check (Next.js 16 "proxy", formerly middleware).
 * Route handlers still verify the session and ownership themselves.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname === "/api" || pathname.startsWith("/api/");

  if (session) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const hadCookie = request.cookies.has(SESSION_COOKIE);
  let response: NextResponse;
  if (isApi) {
    response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } else {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(loginUrl);
  }
  // Drop an invalid or expired session cookie.
  if (hadCookie) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/|favicon\.ico|apple-icon|robots\.txt|sitemap\.xml|.*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|woff|woff2|ttf)$).*)",
  ],
};
