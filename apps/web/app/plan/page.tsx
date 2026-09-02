"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { calculateGoalProgress, getCycleEndDate } from "@twelve-cycle/domain";
import { createId, usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { AutoResizeTextarea } from "@/components/auto-resize-textarea";

function stepForUnit(unit: string) {
  return /giờ|hour/i.test(unit) ? 0.5 : 1;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PlanPage() {
  const { state, updateState } = usePlanner();
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTacticForm, setShowTacticForm] = useState(false);
  const [newTacticUnit, setNewTacticUnit] = useState("lần");
  if (!state) return <LoadingState />;
  const currentState = state;
  const goalCount = state.goals.length;

  function addGoal(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const why = String(formData.get("why") ?? "").trim();
    const target = Number(formData.get("target"));
    if (!title || !unit || !Number.isFinite(target) || target <= 0 || goalCount >= 3) return;
    updateState((draft) => draft.goals.push({ id: createId("goal"), title, why, unit, target, current: 0 }));
    setShowGoalForm(false);
  }

  function addTactic(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const goalId = String(formData.get("goalId") ?? "");
    const unit = String(formData.get("unit") ?? "").trim();
    const target = Number(formData.get("target"));
    const step = stepForUnit(unit);
    if (!title || !goalId || !unit || !Number.isFinite(target) || target < step || Math.abs(target / step - Math.round(target / step)) > 0.0001) return;
    const tacticId = createId("tactic");
    updateState((draft) => {
      draft.tactics.push({ id: tacticId, goalId, title, targetPerWeek: target, unit, scheduledDays: [] });
      draft.commitments.push({ id: createId("commitment"), tacticId, goalId, title, target, completed: 0, unit });
    });
    setShowTacticForm(false);
  }

  function removeGoal(goalId: string) {
    if (!window.confirm("Xóa mục tiêu và toàn bộ chiến thuật liên quan?")) return;
    updateState((draft) => {
      const tacticIds = draft.tactics.filter((item) => item.goalId === goalId).map((item) => item.id);
      const commitmentIds = draft.commitments.filter((item) => item.goalId === goalId).map((item) => item.id);
      draft.goals = draft.goals.filter((item) => item.id !== goalId);
      draft.tactics = draft.tactics.filter((item) => item.goalId !== goalId);
      draft.commitments = draft.commitments.filter((item) => item.goalId !== goalId);
      draft.actionLogs = draft.actionLogs.filter((item) => !commitmentIds.includes(item.commitmentId));
      draft.timeBlocks = draft.timeBlocks.filter((item) => !item.tacticId || !tacticIds.includes(item.tacticId));
    });
  }

  function addCycle(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const why = String(formData.get("why") ?? "").trim();
    if (!window.confirm("Bắt đầu 12 Week Year mới? Chu kỳ hiện tại sẽ được lưu vào lịch sử.")) return;
    const archivedAt = new Date().toISOString();
    const archivedCycle = {
      id: createId("cycle-history"),
      cycle: { ...currentState.cycle },
      goals: currentState.goals.map((goal) => ({ ...goal })),
      tactics: currentState.tactics.map((tactic) => ({ ...tactic, scheduledDays: [...tactic.scheduledDays] })),
      commitments: currentState.commitments.map((commitment) => ({ ...commitment })),
      timeBlocks: currentState.timeBlocks.map((block) => ({ ...block })),
      reviews: currentState.reviews.map((review) => ({ ...review })),
      actionLogs: currentState.actionLogs.map((log) => ({ ...log })),
      archivedAt,
    };
    updateState((draft) => {
      draft.cycleHistory.push(archivedCycle);
      draft.cycle = { id: createId("cycle"), title, why, startDate: archivedAt.slice(0, 10), currentWeek: 1 };
      draft.goals = [];
      draft.tactics = [];
      draft.commitments = [];
      draft.timeBlocks = [];
      draft.reviews = [];
      draft.actionLogs = [];
    });
    setShowCycleForm(false);
  }

  return (
    <>
      <PageHeader eyebrow="12 Week Year · Vision → Goals → Tactics" title="12 Week Plan" description="Giữ chu kỳ tập trung vào tối đa 03 kết quả quan trọng và những hành động dẫn dắt chúng." />

      <section className="panel cycle-settings-panel">
        <div className="section-title"><div><h2>Cycle Settings</h2></div><button className="secondary-button" onClick={() => setShowCycleForm((value) => !value)}><Plus size={17} /> Thêm chu kỳ</button></div>
        {showCycleForm && <form className="panel inline-form cycle-create-form" action={addCycle}><div className="form-grid two"><label className="field"><span>Tên chu kỳ mới</span><input name="title" required placeholder="Tự đặt tên chu kỳ" /></label><label className="field"><span>Lý do quan trọng</span><input name="why" placeholder="Điều gì khiến chu kỳ này đáng ưu tiên?" /></label></div><div className="form-actions"><button type="button" className="quiet-button" onClick={() => setShowCycleForm(false)}>Hủy</button><button className="primary-button" type="submit">Thêm chu kỳ</button></div></form>}
        <div className="cycle-settings">
        <div className="form-grid two">
          <label className="field"><span>Tên chu kỳ</span><input value={state.cycle.title} placeholder="Tự đặt tên chu kỳ" onChange={(event) => updateState((draft) => { draft.cycle.title = event.target.value; })} /></label>
          <label className="field"><span>Tuần hiện tại</span><input type="number" min="1" max="12" value={state.cycle.currentWeek} onChange={(event) => updateState((draft) => { draft.cycle.currentWeek = Math.min(12, Math.max(1, Number(event.target.value))); })} /></label>
        </div>
        <label className="field"><span>Lý do quan trọng</span><AutoResizeTextarea value={state.cycle.why} onChange={(event) => updateState((draft) => { draft.cycle.why = event.target.value; })} rows={2} /></label>
        </div>
        <div className="cycle-timeline" aria-label="Mốc thời gian chu kỳ"><div><span>Today</span><strong>{formatDate(localDateKey())}</strong></div><div><span>Cycle Start</span><strong>{formatDate(state.cycle.startDate)}</strong></div><div><span>Cycle End</span><strong>{formatDate(getCycleEndDate(state.cycle.startDate))}</strong></div></div>
      </section>

      <section className="module-section">
        <div className="section-title"><div><h2>Lag Indicators</h2></div><button className="secondary-button" disabled={state.goals.length >= 3} onClick={() => setShowGoalForm((value) => !value)}><Plus size={17} /> Thêm mục tiêu</button></div>
        {showGoalForm && <form className="panel inline-form" action={addGoal}><div className="form-grid two"><label className="field"><span>Mục tiêu cụ thể</span><input name="title" required placeholder="Ví dụ: Có 50 người dùng kích hoạt" /></label><label className="field"><span>Đơn vị đo</span><input name="unit" required placeholder="người dùng" /></label><label className="field"><span>Giá trị đích</span><input name="target" required type="number" min="1" /></label><label className="field"><span>Tại sao quan trọng?</span><input name="why" placeholder="Lý do tạo cam kết" /></label></div><div className="form-actions"><button type="button" className="quiet-button" onClick={() => setShowGoalForm(false)}>Hủy</button><button className="primary-button" type="submit">Lưu mục tiêu</button></div></form>}
        <div className="goal-grid">
          {state.goals.map((goal, index) => <article className="panel goal-editor" key={goal.id}><div className="goal-editor-header"><span className="goal-index">0{index + 1}</span><button className="icon-button danger" onClick={() => removeGoal(goal.id)} aria-label={`Xóa ${goal.title}`}><Trash2 size={17} /></button></div><AutoResizeTextarea className="bare-title-input" rows={2} value={goal.title} onChange={(event) => updateState((draft) => { const item = draft.goals.find((candidate) => candidate.id === goal.id); if (item) item.title = event.target.value; })} /><p>{goal.why || "Thêm lý do để củng cố cam kết."}</p><div className="bar tall"><span style={{ width: `${calculateGoalProgress(goal)}%` }} /></div><div className="progress-inputs"><label><span>Hiện tại</span><input type="number" min="0" value={goal.current} onChange={(event) => updateState((draft) => { const item = draft.goals.find((candidate) => candidate.id === goal.id); if (item) item.current = Math.max(0, Number(event.target.value)); })} /></label><span>/</span><label><span>Mục tiêu</span><input type="number" min="1" value={goal.target} onChange={(event) => updateState((draft) => { const item = draft.goals.find((candidate) => candidate.id === goal.id); if (item) item.target = Math.max(1, Number(event.target.value)); })} /></label><strong>{goal.unit}</strong></div></article>)}
        </div>
      </section>

      <section className="module-section" id="tactics">
        <div className="section-title"><div><h2>Lead Indicators</h2></div><button className="secondary-button" disabled={!state.goals.length} onClick={() => setShowTacticForm((value) => !value)}><Plus size={17} /> Thêm chiến thuật</button></div>
        {showTacticForm && <form className="panel inline-form" action={addTactic}><div className="form-grid three"><label className="field"><span>Gắn với mục tiêu</span><select name="goalId" required defaultValue={state.goals[0]?.id}>{state.goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select></label><label className="field"><span>Hành động kiểm soát được</span><input name="title" required placeholder="Ví dụ: Gọi 5 khách hàng" /></label><label className="field"><span>Mục tiêu mỗi tuần</span><input name="target" required type="number" min={stepForUnit(newTacticUnit)} step={stepForUnit(newTacticUnit)} max="1000" defaultValue="1" /></label><label className="field"><span>Đơn vị đo</span><input name="unit" value={newTacticUnit} onChange={(event) => setNewTacticUnit(event.target.value)} list="unit-suggestions" required placeholder="Ví dụ: lần, giờ, trang" /></label></div><div className="form-actions"><button type="button" className="quiet-button" onClick={() => setShowTacticForm(false)}>Hủy</button><button className="primary-button" type="submit">Thêm vào kế hoạch</button></div></form>}
        <div className="panel data-list">{state.tactics.map((tactic) => { const goal = state.goals.find((item) => item.id === tactic.goalId); const step = stepForUnit(tactic.unit); return <div className="data-row tactic-row" key={tactic.id}><div><AutoResizeTextarea className="tactic-title-input" rows={2} aria-label={`Tên chiến thuật ${tactic.title}`} value={tactic.title} onChange={(event) => updateState((draft) => { const item = draft.tactics.find((candidate) => candidate.id === tactic.id); if (item) item.title = event.target.value; })} /><span>{goal?.title}</span></div><label className="compact-field"><span>Mục tiêu</span><span className="tactic-target-control"><input aria-label={`Mục tiêu mỗi tuần của ${tactic.title}`} type="number" min={step} step={step} max="1000" value={tactic.targetPerWeek} onChange={(event) => updateState((draft) => { const item = draft.tactics.find((candidate) => candidate.id === tactic.id); if (item) { const value = Number(event.target.value); item.targetPerWeek = Number.isFinite(value) ? Math.max(step, Math.round(value / step) * step) : step; } })} /><span className="tactic-unit-label">{tactic.unit}</span></span></label><button className="icon-button danger" aria-label={`Xóa ${tactic.title}`} onClick={() => updateState((draft) => { const commitmentIds = draft.commitments.filter((item) => item.tacticId === tactic.id).map((item) => item.id); draft.tactics = draft.tactics.filter((item) => item.id !== tactic.id); draft.commitments = draft.commitments.filter((item) => item.tacticId !== tactic.id); draft.actionLogs = draft.actionLogs.filter((item) => !commitmentIds.includes(item.commitmentId)); })}><Trash2 size={16} /></button></div>; })}{!state.tactics.length && <div className="empty-inline">Chưa có chiến thuật nào.</div>}</div>
        <datalist id="unit-suggestions"><option value="lần" /><option value="giờ" /><option value="phút" /><option value="trang" /><option value="buổi" /><option value="cuộc gọi" /><option value="phiên" /></datalist>
      </section>
    </>
  );
}
