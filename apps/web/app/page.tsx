"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, Circle, Clock3, Flame, Plus, Target } from "lucide-react";
import { calculateCalendarPenalty, calculateExecutionScore, calculateGoalProgress, getCycleEndDate } from "@twelve-cycle/domain";
import { createId, usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { ActionHistoryChart } from "@/components/action-history-chart";
import { FrameworkReminder } from "@/components/framework-reminder";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

export default function TodayPage() {
  const { state, updateState } = usePlanner();
  if (!state) return <LoadingState />;

  const calendarPenalty = calculateCalendarPenalty(state.timeBlocks);
  const score = calculateExecutionScore(state.commitments, state.timeBlocks);
  const completed = state.commitments.reduce((sum, item) => sum + Math.min(item.completed, item.target), 0);
  const target = state.commitments.reduce((sum, item) => sum + item.target, 0);
  const primaryGoal = state.goals[0];
  const today = localDateKey();
  const cycleEndDate = getCycleEndDate(state.cycle.startDate);
  const todayBlocks = state.timeBlocks.filter((block) => block.date === today);
  const strategicMinutes = todayBlocks
    .filter((block) => block.type === "strategic")
    .reduce((sum, block) => {
      const [startHour, startMinute] = block.startTime.split(":").map(Number);
      const [endHour, endMinute] = block.endTime.split(":").map(Number);
      return sum + Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
    }, 0);

  function toggleCommitment(id: string) {
    updateState((draft) => {
      const commitment = draft.commitments.find((item) => item.id === id);
      if (!commitment) return;
      const previous = commitment.completed;
      commitment.completed = commitment.completed >= commitment.target ? 0 : commitment.target;
      const delta = commitment.completed - previous;
      if (delta > 0) draft.actionLogs.push({ id: createId("action"), date: new Date().toISOString().slice(0, 10), week: draft.cycle.currentWeek, commitmentId: commitment.id, amount: delta });
    });
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">Week {state.cycle.currentWeek} · 12 Week Plan</div>
          <div className="current-date"><CalendarDays size={15} /> Today · {formatDate(today)}</div>
          <div className="cycle-range">Cycle {formatDate(state.cycle.startDate)} → {formatDate(cycleEndDate)}</div>
        </div>
        <Link className="primary-button" href="/plan#tactics"><Plus size={18} /> Thêm chiến thuật</Link>
      </header>

      <section className="focus-banner">
        <div>
          <span className="banner-kicker"><Flame size={16} /> Weekly Focus · Week {state.cycle.currentWeek}</span>
          <h2>{primaryGoal?.title ?? "Hãy tạo mục tiêu đầu tiên cho chu kỳ."}</h2>
          <p>{primaryGoal?.why || state.cycle.why}</p>
        </div>
        <Link className="ghost-button" href="/week">Mở kế hoạch tuần <ArrowUpRight size={17} /></Link>
      </section>

      <FrameworkReminder />

      <section className="metrics-grid" aria-label="Số liệu tuần">
        <article className="metric-card score-card">
          <div className="metric-heading"><span>Execution Score</span><span className={`status-dot ${score < 85 ? "warning" : ""}`}>{score >= 85 ? "On Track" : "Needs Attention"}</span></div>
          <div className="score-row">
            <div className="score-ring" style={{ "--score": `${score}%` } as React.CSSProperties}><span>{score}%</span></div>
            <div><strong>Mục tiêu 85%</strong><p>{completed}/{target} đơn vị đã hoàn thành</p>{calendarPenalty > 0 && <span className="score-penalty">Calendar −{calendarPenalty} pts</span>}</div>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-heading"><span>Current Week</span><CalendarDays size={18} /></div>
          <div className="large-value">{String(state.cycle.currentWeek).padStart(2, "0")} <small>/ 12</small></div>
          <p>{12 - state.cycle.currentWeek} tuần để hoàn thành chu kỳ.</p>
          <div className="metric-range">{formatDate(state.cycle.startDate)} → {formatDate(cycleEndDate)}</div>
        </article>
        <article className="metric-card">
          <div className="metric-heading"><span>Strategic Time</span><Clock3 size={18} /></div>
          <div className="large-value">{Math.round((strategicMinutes / 60) * 10) / 10} giờ <small>đã lên lịch</small></div>
          <div className="bar"><span style={{ width: `${Math.min(100, (strategicMinutes / 180) * 100)}%` }} /></div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel today-panel">
          <div className="panel-header"><div><h3>Weekly Commitments</h3></div><span className="soft-count">{state.commitments.length} tactics</span></div>
          {state.commitments.length === 0 ? (
            <div className="empty-inline">Chưa có cam kết. <Link href="/plan#tactics">Tạo chiến thuật đầu tiên</Link>.</div>
          ) : (
            <div className="tactic-list">
              {state.commitments.slice(0, 4).map((commitment) => {
                const done = commitment.completed >= commitment.target;
                const goal = state.goals.find((item) => item.id === commitment.goalId);
                return (
                  <div className={`tactic ${done ? "done" : ""}`} key={commitment.id}>
                    <button className="check-button" onClick={() => toggleCommitment(commitment.id)} aria-label={`${done ? "Bỏ hoàn thành" : "Hoàn thành"} ${commitment.title}`}>
                      {done ? <Check size={16} /> : <Circle size={17} />}
                    </button>
                    <div className="tactic-copy"><strong>{commitment.title}</strong><span>{commitment.completed}/{commitment.target} {commitment.unit} · Lead indicator</span></div>
                    <span className="tag green">{goal?.title ?? "Mục tiêu"}</span>
                  </div>
                );
              })}
            </div>
          )}
          <Link className="text-button" href="/week"><Plus size={17} /> Quản lý kế hoạch tuần</Link>
        </article>

        <article className="panel goal-panel">
          <div className="panel-header"><div><h3>12 Week Goals</h3></div><Target size={20} /></div>
          {primaryGoal ? (
            <>
              <div className="goal-number"><strong>{primaryGoal.current}</strong><span>/ {primaryGoal.target} {primaryGoal.unit}</span></div>
              <div className="bar tall"><span style={{ width: `${calculateGoalProgress(primaryGoal)}%` }} /></div>
              <div className="goal-caption"><span>Tiến độ {calculateGoalProgress(primaryGoal)}%</span><span>Mục tiêu: {primaryGoal.target}</span></div>
              <div className="next-milestone"><span>Kết nối hành động với kết quả</span><strong>{state.tactics.filter((item) => item.goalId === primaryGoal.id).length} chiến thuật dẫn dắt đang hoạt động</strong></div>
            </>
          ) : <div className="empty-inline">Chưa có mục tiêu 12 tuần.</div>}
        </article>
      </section>
      <ActionHistoryChart logs={state.actionLogs} commitments={state.commitments} currentWeek={state.cycle.currentWeek} />
    </>
  );
}
