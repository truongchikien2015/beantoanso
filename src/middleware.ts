import { NextRequest, NextResponse } from "next/server";

// Redirect /student → /student/login
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only redirect exact /student (no trailing slash) to avoid redirecting
  // /student/login, /student/dashboard, /student/quiz, /student/progress
  if (pathname === "/student") {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/student/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student"],
};
