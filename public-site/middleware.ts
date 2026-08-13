import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * UX-level route guarding. The real enforcement lives in the API layer
 * (lib/rbac.ts guards) — middleware just prevents flashing protected pages
 * and bounces logged-out users to the right login screen.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Expose the path so server layouts can special-case the admin login page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Logged out → bounce protected areas to login (login page itself excluded).
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (pathname.startsWith("/member") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/trainer") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/login", "/register", "/admin/:path*", "/member/:path*", "/trainer/:path*"],
};
