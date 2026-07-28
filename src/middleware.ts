import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    const role = token.role as string;

    // Role-based route protection
    if (pathname.startsWith("/tl-dashboard") && role !== "TEAM_LEADER") {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }
    
    if (pathname.startsWith("/operator-terminal") && role !== "OPERATORE" && role !== "TEAM_LEADER") {
       return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }

    if (pathname.startsWith("/commercial-app") && role !== "COMMERCIALE" && role !== "TEAM_LEADER") {
       return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }

    // Redirect root to appropriate dashboard
    if (pathname === "/") {
        if (role === "TEAM_LEADER") return NextResponse.redirect(new URL("/tl-dashboard", req.nextUrl));
        if (role === "OPERATORE") return NextResponse.redirect(new URL("/operator-terminal", req.nextUrl));
        if (role === "COMMERCIALE") return NextResponse.redirect(new URL("/commercial-app", req.nextUrl));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    }
  }
);

export const config = {
  matcher: ["/", "/tl-dashboard/:path*", "/operator-terminal/:path*", "/commercial-app/:path*"],
};
