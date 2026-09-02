import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthAccount, getAuthConfig } from "@/lib/auth-store";

const setupSchema = z.object({
  username: z.string().trim().regex(/^[\w.-]{3,80}$/u),
  password: z.string().min(8).max(200),
  confirmation: z.string().min(8).max(200),
}).refine((value) => value.password === value.confirmation, { message: "Mật khẩu nhập lại không khớp.", path: ["confirmation"] });

export async function POST(request: Request) {
  if (await getAuthConfig()) return NextResponse.json({ message: "Tài khoản đã được tạo." }, { status: 409 });
  const parsed = setupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Tên tài khoản hoặc mật khẩu chưa hợp lệ." }, { status: 400 });

  try {
    await createAuthAccount(parsed.data.username, parsed.data.password);
    return NextResponse.json({ created: true });
  } catch {
    return NextResponse.json({ message: "Không thể tạo tài khoản. Vui lòng thử lại." }, { status: 500 });
  }
}
