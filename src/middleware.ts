import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/dist/server/api-utils";
import { user_role } from "@prisma/client";

export async function middleware(req: NextRequest) {
  const userCookie = cookies().get("user");

  const isAuthPage = req.nextUrl.pathname === "/auth";

  const sheetsURL = new URL("/dashboard/sheets", req.url);
  const authURL = new URL("/auth", req.url);
  const dashboardURL = new URL("/dashboard", req.url);

  if (isAuthPage) {
    if (userCookie) return NextResponse.redirect(dashboardURL);

    return NextResponse.next();
  }

  if (!userCookie) return NextResponse.redirect(authURL);

  const user = JSON.parse(userCookie.value);
  const isAdmin = user.role === user_role.ADMIN;

  if (req.nextUrl.pathname !== "/dashboard/sheets" && !isAdmin) return NextResponse.redirect(sheetsURL);
  
  
  const res = NextResponse.next();
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
