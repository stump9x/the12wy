import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: session.username });
}
