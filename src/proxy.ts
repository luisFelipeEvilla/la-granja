import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type Role } from "@/lib/auth/session";

// reachable without a session
const PUBLIC_PAGES = ["/auth"];
const PUBLIC_PAGE_PREFIXES = ["/firmar/"]; // client signing links
const PUBLIC_API = ["/api/auth/signin", "/api/auth/signout"];
const PUBLIC_API_PREFIXES = ["/api/signatures/"]; // the token in the URL is the credential

// what the USER role (collection staff) may do; everything else is ADMIN only
const USER_PAGES = ["/dashboard/sheets"];
const USER_API: Record<string, string[]> = {
  "/api/auth/me": ["GET"],
  "/api/providers": ["GET"],
  "/api/products": ["GET"],
  "/api/sheets": ["GET"],
};

const isPublic = (pathname: string) =>
  PUBLIC_PAGES.includes(pathname) || PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  PUBLIC_API.includes(pathname) || PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

function canAccess(role: Role, pathname: string, method: string) {
  if (role === "ADMIN") return true;
  if (pathname.startsWith("/api/")) return USER_API[pathname]?.includes(method) ?? false;
  return USER_PAGES.includes(pathname);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", req.url));

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/auth" && session) return NextResponse.redirect(new URL("/dashboard", req.url));
  if (isPublic(pathname)) return NextResponse.next();

  if (!session) {
    if (isApi) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    const response = NextResponse.redirect(new URL("/auth", req.url));
    response.cookies.delete("user"); // old unsigned cookie
    return response;
  }

  if (!canAccess(session.role, pathname, req.method)) {
    if (isApi) return NextResponse.json({ message: "No tienes permiso para esta acción" }, { status: 403 });
    return NextResponse.redirect(new URL(USER_PAGES[0], req.url));
  }

  return NextResponse.next();
}

export const config = {
  // everything except Next.js assets and public files (paths with an extension)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
