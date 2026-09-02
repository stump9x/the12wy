"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckCircle2, History, LayoutDashboard, ListChecks, LogOut, RotateCcw, Target } from "lucide-react";
import { usePlanner } from "@/components/planner-provider";

const navigation = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/plan", label: "12 Week Plan", icon: Target },
  { href: "/week", label: "Weekly Plan", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/review", label: "Weekly Review", icon: RotateCcw },
  { href: "/journal", label: "Journal", icon: History },
];

export function PlannerAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, saveStatus, error } = usePlanner();
  const week = state?.cycle.currentWeek ?? 1;
  const cycleProgress = Math.round((week / 12) * 100);

  if (pathname === "/login" || pathname === "/setup") return <>{children}</>;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Điều hướng chính">
        <Link className="brand" href="/" aria-label="12 Week Year — Trang chủ">
          <span className="brand-mark">12</span>
          <span>Week Year</span>
        </Link>

        <nav className="nav-list">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link className={`nav-item ${active ? "active" : ""}`} href={href} key={href}>
                <Icon size={18} /> <span>{label}</span>
              </Link>
            );
          })}
          <button className="nav-item mobile-nav-logout" onClick={logout} aria-label="Đăng xuất">
            <LogOut size={18} /> <span>Đăng xuất</span>
          </button>
        </nav>

        <section className="cycle-card" aria-label="Chu kỳ hiện tại">
          <div className="eyebrow">Current Cycle</div>
          <strong>{state?.cycle.title ?? "Đang tải kế hoạch…"}</strong>
          <div className="mini-progress" aria-label={`Tiến độ chu kỳ ${cycleProgress}%`}>
            <span style={{ width: `${cycleProgress}%` }} />
          </div>
          <div className="cycle-meta"><span>Tuần {week}/12</span><span>{12 - week} tuần còn lại</span></div>
        </section>

        <div className={`save-state ${saveStatus}`} role="status">
          <CheckCircle2 size={14} />
          {saveStatus === "loading" && "Đang tải dữ liệu"}
          {saveStatus === "saving" && "Đang lưu thay đổi"}
          {saveStatus === "saved" && "Đã lưu trên thiết bị chủ"}
          {saveStatus === "error" && (error ?? "Lưu thất bại")}
        </div>
        <button className="logout-button" onClick={logout}><LogOut size={14} /> Đăng xuất</button>
      </aside>
      <section className="workspace">{children}</section>
    </main>
  );
}
