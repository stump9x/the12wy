import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, useSecureCookie } from "@/lib/auth-core";

export function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    path: "/",
    maxAge: 0,
  });
  return response;
}
