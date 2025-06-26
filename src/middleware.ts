import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/about"]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, orgId, orgRole } = auth();

  // Redirect to onboarding if user exists but no org
  if (userId && !orgId && req.nextUrl.pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Admin-only routes
  if (req.nextUrl.pathname.startsWith("/hospital-admin")) {
    if (orgRole !== "org:admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Staff routes (doctors, nurses, etc.)
  if (req.nextUrl.pathname.startsWith("/staff")) {
    if (!orgId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};