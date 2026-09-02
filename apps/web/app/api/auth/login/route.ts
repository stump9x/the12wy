import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME, createSessionToken, isAuthConfigured, SESSION_DURATION_SECONDS, useSecureCookie, verifyCredentials } from "@/lib/auth-core";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  if (!await isAuthConfigured()) {
    return NextResponse.json({ message: "Hệ thống chưa được cấu hình đăng nhập." }, { status: 503 });
  }
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !await verifyCredentials(parsed.data.username, parsed.data.password)) {
    return NextResponse.json({ message: "Tên đăng nhập hoặc mật khẩu không đúng." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, username: parsed.data.username });
  response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(parsed.data.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
