"use client";

import Link from "next/link";
import { Minus, Plus, RefreshCw, Target } from "lucide-react";
import { calculateCalendarPenalty, calculateExecutionScore } from "@twelve-cycle/domain";
import { createId, usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";

export default function WeekPage() {
  const { state, updateState } = usePlanner();
  if (!state) return <LoadingState />;
  const calendarPenalty = calculateCalendarPenalty(state.timeBlocks);
  const score = calculateExecutionScore(state.commitments, state.timeBlocks);

  function changeCompleted(id: string, change: number) {
    updateState((draft) => {
      const item = draft.commitments.find((candidate) => candidate.id === id);
      if (!item) return;
      const previous = item.completed;
      item.completed = Math.min(item.target, Math.max(0, item.completed + change));
      const delta = item.completed - previous;
      if (delta > 0) draft.actionLogs.push({ id: createId("action"), date: new Date().toISOString().slice(0, 10), week: draft.cycle.currentWeek, commitmentId: item.id, amount: delta });
    });
  }

  function setCompleted(id: string, value: number) {
    updateState((draft) => {
      const item = draft.commitments.find((candidate) => candidate.id === id);
      if (!item) return;
      const previous = item.completed;
      const step = stepForUnit(item.unit);
      const rounded = Number.isFinite(value) ? Math.round(value / step) * step : 0;
      item.completed = Math.min(item.target, Math.max(0, rounded));
      const delta = item.completed - previous;
      if (delta > 0) draft.actionLogs.push({ id: createId("action"), date: new Date().toISOString().slice(0, 10), week: draft.cycle.currentWeek, commitmentId: item.id, amount: delta });
    });
  }

  function stepForUnit(unit: string) {
    return /giờ|hour/i.test(unit) ? 0.5 : 1;
  }

  function syncFromPlan() {
    updateState((draft) => {
      for (const tactic of draft.tactics) {
        const existing = draft.commitments.find((item) => item.tacticId === tactic.id);
        if (existing) {
          existing.title = tactic.title;
          existing.target = tactic.targetPerWeek;
          existing.unit = tactic.unit;
          existing.completed = Math.min(existing.completed, existing.target);
        } else {
          draft.commitments.push({ id: createId("commitment"), tacticId: tactic.id, goalId: tactic.goalId, title: tactic.title, target: tactic.targetPerWeek, completed: 0, unit: tactic.unit });
        }
      }
      draft.commitments = draft.commitments.filter((item) => draft.tactics.some((tactic) => tactic.id === item.tacticId));
    });
  }

  return (
    <>
      <PageHeader eyebrow={`Week ${state.cycle.currentWeek} / 12 · Weekly Plan`} title="Weekly Plan" description="Đây là kế hoạch hành động 7 ngày. Chỉ giữ những việc chiến lược đến hạn trong 12 Week Plan." action={<button className="secondary-button" onClick={syncFromPlan}><RefreshCw size={16} /> Đồng bộ từ kế hoạch</button>} />
      <section className="week-score-panel">
        <div className="score-ring large" style={{ "--score": `${score}%` } as React.CSSProperties}><span>{score}%</span></div>
        <div><span className="eyebrow">Weekly Execution Score</span><h2>{score >= 85 ? "Executing on rhythm." : "Focus on the missing actions."}</h2><p>Mốc 85% đo mức độ giữ cam kết, không dùng kết quả cuối cùng để bù điểm.{calendarPenalty > 0 && ` Calendar penalty: −${calendarPenalty} points.`}</p></div>
      </section>

      <section className="module-section">
        <div className="section-title"><div><h2>Weekly Commitments</h2></div><Link className="text-button" href="/plan#tactics"><Plus size={16} /> Tạo chiến thuật mới</Link></div>
        <div className="commitment-grid">
          {state.commitments.map((commitment) => {
            const goal = state.goals.find((item) => item.id === commitment.goalId);
            const percent = Math.round((commitment.completed / commitment.target) * 100);
            const step = stepForUnit(commitment.unit);
            return <article className="panel commitment-card" key={commitment.id}><div className="commitment-top"><span className="tag green">{goal?.title ?? "Mục tiêu"}</span><Target size={18} /></div><h3>{commitment.title}</h3><div className="bar tall"><span style={{ width: `${Math.min(100, percent)}%` }} /></div><div className="counter-row"><button type="button" className="counter-button" onClick={() => changeCompleted(commitment.id, -step)} disabled={commitment.completed === 0} aria-label={`Giảm tiến độ ${commitment.title}`}><Minus size={17} /></button><div><strong>{commitment.completed}</strong><span>/ {commitment.target} {commitment.unit}</span><input className="completion-input" aria-label={`Đã hoàn thành ${commitment.title}`} type="number" min="0" max={commitment.target} step={step} value={commitment.completed} onChange={(event) => setCompleted(commitment.id, Number(event.target.value))} /></div><button type="button" className="counter-button positive" onClick={() => changeCompleted(commitment.id, step)} disabled={commitment.completed >= commitment.target} aria-label={`Tăng tiến độ ${commitment.title}`}><Plus size={17} /></button></div></article>;
          })}
        </div>
        {!state.commitments.length && <div className="panel empty-state"><h3>No Weekly Commitments</h3><p>Hãy tạo chiến thuật dẫn dắt trong kế hoạch 12 tuần rồi đồng bộ vào đây.</p><Link className="primary-button" href="/plan#tactics">Mở kế hoạch 12 tuần</Link></div>}
      </section>
    </>
  );
}
