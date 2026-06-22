import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Token is in localStorage (client-side only) — middleware runs server-side
  // and cannot read it. Just redirect / → /dashboard and let the dashboard's
  // client-side auth guard handle the /login redirect if no token exists.
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}

export const config = {
  matcher: "/",
};