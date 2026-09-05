import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "pulse_session";
const PROTECTED_PREFIXES = ["/dashboard", "/goals", "/learning", "/growth", "/analytics", "/library", "/settings", "/news"];
const AUTH_PAGES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users shouldn't see the login/signup forms again.
  // (Cookie presence only — an expired-but-present cookie is corrected by
  // requireUser() the moment they hit a protected page.)
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  if (isAuthPage && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/goals/:path*", "/learning/:path*", "/growth/:path*", "/analytics/:path*", "/library/:path*", "/settings/:path*", "/news/:path*", "/login", "/signup"],
};
