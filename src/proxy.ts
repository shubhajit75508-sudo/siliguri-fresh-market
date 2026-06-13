import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN_URL = "/auth/login";

function getRoleFromCookie(request: NextRequest): string | null {
  const session = request.cookies.get("sfm-auth-session");
  if (!session?.value) return null;
  const parts = session.value.split("|");
  return parts.length === 2 ? parts[1] : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy admin/delivery login pages to unified auth
  if (pathname === "/admin/login" || pathname === "/delivery/login") {
    return NextResponse.redirect(new URL(LOGIN_URL, request.url));
  }

  const role = getRoleFromCookie(request);

  // Guard /admin routes
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL(LOGIN_URL, request.url));
    }
  }

  // Guard /delivery routes
  if (pathname.startsWith("/delivery")) {
    if (role !== "delivery") {
      return NextResponse.redirect(new URL(LOGIN_URL, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/delivery/:path*"],
};
