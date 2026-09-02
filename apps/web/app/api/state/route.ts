import { NextResponse } from "next/server";
import type { PlannerState } from "@twelve-cycle/domain";
import { plannerStateSchema } from "@/lib/planner-schema";
import { getPlannerState, savePlannerState } from "@/lib/planner-repository";
import { getAuthenticatedSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    const state = await getPlannerState();
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load planner state", error);
    return NextResponse.json({ message: "Không thể tải dữ liệu planner." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    const parsed = plannerStateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Dữ liệu planner không hợp lệ.", issues: parsed.error.issues }, { status: 400 });
    }
    const state: PlannerState = { ...parsed.data, updatedAt: new Date().toISOString() };
    await savePlannerState(state);
    return NextResponse.json({ state, saved: true });
  } catch (error) {
    console.error("Unable to save planner state", error);
    return NextResponse.json({ message: "Không thể lưu dữ liệu planner." }, { status: 500 });
  }
}
