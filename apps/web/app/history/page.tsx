"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateGoalProgress } from "@twelve-cycle/domain";
import type { ArchivedCycle, PlannerState } from "@twelve-cycle/domain";
import { usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";

type HistoryCycle = Omit<ArchivedCycle, "archivedAt"> & { active: boolean; archivedAt?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function toCurrentCycle(state: PlannerState): HistoryCycle {
  return {
    id: state.cycle.id,
    cycle: { ...state.cycle },
    goals: state.goals,
    tactics: state.tactics,
    commitments: state.commitments,
    timeBlocks: state.timeBlocks,
    reviews: state.reviews,
    actionLogs: state.actionLogs,
    active: true,
  };
}

export default function HistoryPage() {
  const { state } = usePlanner();
  const [selectedCycleId, setSelectedCycleId] = useState("");

  const cycles = useMemo<HistoryCycle[]>(() => [
    ...(state ? [toCurrentCycle(state), ...state.cycleHistory.slice().reverse().map((item) => ({ ...item, active: false }))] : []),
  ], [state]);

  useEffect(() => {
    if (!state) return;
    if (!cycles.some((item) => item.id === selectedCycleId)) setSelectedCycleId(state.cycle.id);
  }, [cycles, selectedCycleId, state]);

  if (!state) return <LoadingState />;

  const selected = cycles.find((item) => item.id === selectedCycleId) ?? cycles[0];
  if (!selected) return null;
  const commitmentMap = new Map(selected.commitments.map((item) => [item.id, item]));
  const goalMap = new Map(selected.goals.map((item) => [item.id, item]));
  const weeks = Array.from(new Set([
    ...selected.actionLogs.map((item) => item.week),
    ...selected.reviews.map((item) => item.week),
  ])).sort((a, b) => b - a);

  return (
    <>
      <PageHeader eyebrow="Journal" title="Cycle Journal" description="Xem lại toàn bộ chu kỳ, mục tiêu, chiến thuật, hành động và Weekly Review đã lưu." />

      <section className="history-layout">
        <aside className="panel cycle-selector" aria-label="Danh sách chu kỳ">
          <div className="panel-header"><div><h3>Cycles</h3></div><span className="soft-count">{cycles.length}</span></div>
          <div className="cycle-selector-list">
            {cycles.map((item) => (
              <button className={`cycle-selector-item ${item.id === selected.id ? "active" : ""}`} key={item.id} onClick={() => setSelectedCycleId(item.id)}>
                <span className="cycle-selector-status">{item.active ? "Current" : "Archived"}</span>
                <strong>{item.cycle.title}</strong>
                <small>{formatDate(item.cycle.startDate)} · Week {item.cycle.currentWeek}/12</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="cycle-detail">
          <section className="panel cycle-detail-header">
            <div><span className="eyebrow">{selected.active ? "Current Cycle" : "Archived Cycle"}</span><h2>{selected.cycle.title}</h2><p>{selected.cycle.why || "Không có lý do được ghi cho chu kỳ này."}</p></div>
            <span className="cycle-detail-date">{formatDate(selected.cycle.startDate)} · Week {selected.cycle.currentWeek}/12</span>
          </section>

          <section className="cycle-summary-grid" aria-label="Tổng quan chu kỳ">
            <article className="metric-card"><span className="metric-label">Goals</span><strong>{selected.goals.length}</strong><small>mục tiêu</small></article>
            <article className="metric-card"><span className="metric-label">Tactics</span><strong>{selected.tactics.length}</strong><small>chiến thuật</small></article>
            <article className="metric-card"><span className="metric-label">Actions</span><strong>{selected.actionLogs.length}</strong><small>nhật ký</small></article>
            <article className="metric-card"><span className="metric-label">Reviews</span><strong>{selected.reviews.length}</strong><small>weekly reviews</small></article>
          </section>

          <section className="panel archive-section">
            <div className="section-title"><div><h2>Goals</h2></div></div>
            {selected.goals.length ? <div className="archive-goal-list">{selected.goals.map((goal) => <article className="archive-goal" key={goal.id}><div className="archive-item-heading"><strong>{goal.title}</strong><span>{calculateGoalProgress(goal)}%</span></div><p>{goal.why || "Không có ghi chú."}</p><div className="bar tall"><span style={{ width: `${calculateGoalProgress(goal)}%` }} /></div><small>{formatAmount(goal.current)} / {formatAmount(goal.target)} {goal.unit}</small></article>)}</div> : <p className="archive-empty">Không có mục tiêu trong chu kỳ này.</p>}
          </section>

          <section className="panel archive-section">
            <div className="section-title"><div><h2>Tactics</h2></div></div>
            {selected.tactics.length ? <div className="archive-tactic-list">{selected.tactics.map((tactic) => <article className="archive-tactic" key={tactic.id}><div><strong>{tactic.title}</strong><span>{goalMap.get(tactic.goalId)?.title ?? "Goal không xác định"}</span></div><b>{formatAmount(tactic.targetPerWeek)} {tactic.unit}<small>/ tuần</small></b></article>)}</div> : <p className="archive-empty">Không có chiến thuật trong chu kỳ này.</p>}
          </section>

          <section className="panel archive-section">
            <div className="section-title"><div><h2>Action Journal</h2></div></div>
            {weeks.length ? <div className="archive-week-list">{weeks.map((week) => { const weekLogs = selected.actionLogs.filter((item) => item.week === week); const review = selected.reviews.find((item) => item.week === week); return <details className="archive-week" key={week}><summary className="archive-item-heading"><strong>Week {week}</strong><span>{weekLogs.length} actions</span></summary>{weekLogs.length ? <ul>{weekLogs.map((log) => { const commitment = commitmentMap.get(log.commitmentId); return <li key={log.id}><span>{commitment?.title ?? "Action không xác định"}<small>{formatDate(log.date)}</small></span><b>{formatAmount(log.amount)} {commitment?.unit ?? "unit"}</b></li>; })}</ul> : <p className="archive-empty">Không có action log trong tuần này.</p>}{review && <div className="archive-review"><b>Weekly Review · {review.score}%</b><p>{review.adjustment || review.lessons || "Chưa có ghi chú điều chỉnh."}</p></div>}</details>; })}</div> : <p className="archive-empty">Chưa có lịch sử hành động hoặc Weekly Review.</p>}
          </section>
        </div>
      </section>
    </>
  );
}
