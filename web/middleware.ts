import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("healthsync_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", request.url));
  }
}

export const config = {
  matcher: "/",
};