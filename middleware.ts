import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "resqlink-lanka-secret-key-development-2026"
      : undefined);

  const token = await getToken({
    req,
    secret,
  });

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isDashboardPage =
    pathname.startsWith("/dmc") ||
    pathname.startsWith("/district-officer") ||
    pathname.startsWith("/citizen");

  if (isAuthPage) {
    if (token) {
      // Redirect logged-in user to their role dashboard
      if (token.role === "DMC_OFFICER") {
        return NextResponse.redirect(new URL("/dmc/warnings", req.url));
      } else if (token.role === "DISTRICT_OFFICER") {
        return NextResponse.redirect(new URL("/district-officer/incidents", req.url));
      } else {
        return NextResponse.redirect(new URL("/citizen/alerts", req.url));
      }
    }
    return NextResponse.next();
  }

  if (isDashboardPage) {
    if (!token) {
      const signinUrl = new URL("/signin", req.url);
      signinUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }

    // Role-specific route enforcement
    if (pathname.startsWith("/dmc") && token.role !== "DMC_OFFICER") {
      return NextResponse.redirect(new URL("/citizen/alerts", req.url));
    }

    if (
      pathname.startsWith("/district-officer") &&
      token.role !== "DISTRICT_OFFICER" &&
      token.role !== "DMC_OFFICER"
    ) {
      return NextResponse.redirect(new URL("/citizen/alerts", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/signin",
    "/signup",
    "/dmc/:path*",
    "/district-officer/:path*",
    "/citizen/:path*",
  ],
};
