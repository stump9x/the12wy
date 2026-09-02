import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isAuthConfigured, verifySessionToken } from "@/lib/auth-core";

const publicPaths = new Set(["/login", "/setup", "/api/auth/login", "/api/auth/logout", "/api/auth/session", "/api/auth/setup", "/api/health"]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const configured = await isAuthConfigured();
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === "/login" && session) return NextResponse.redirect(new URL("/", request.url));
  if (pathname === "/setup" && configured) return NextResponse.redirect(new URL("/login", request.url));
  if (!configured && pathname === "/login") return NextResponse.redirect(new URL("/setup", request.url));
  if (publicPaths.has(pathname)) return NextResponse.next();
  if (session) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|og.png|sw.js|manifest.webmanifest).*)"],
};
