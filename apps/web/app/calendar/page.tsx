"use client";

import { useState } from "react";
import { CalendarClock, Check, Clock3, Trash2 } from "lucide-react";
import type { TimeBlockHistoryAction, TimeBlockStatus, TimeBlockType } from "@twelve-cycle/domain";
import { createId, usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";

const blockLabels: Record<TimeBlockType, string> = { strategic: "Strategic", buffer: "Buffer", breakout: "Breakout" };
const statusLabels: Record<TimeBlockStatus, string> = { planned: "Đã lên lịch", completed: "Hoàn thành", postponed: "Đã trì hoãn" };
const historyActionLabels: Record<TimeBlockHistoryAction, string> = { completed: "Hoàn thành", postponed: "Trì hoãn", rescheduled: "Chuyển ngày", reopened: "Đặt lại" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export default function CalendarPage() {
  const { state, updateState } = usePlanner();
  const [showForm, setShowForm] = useState(false);
  const [rescheduleBlockId, setRescheduleBlockId] = useState<string | null>(null);
  if (!state) return <LoadingState />;

  function addBlock(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    const type = String(formData.get("type") ?? "strategic") as TimeBlockType;
    const tacticId = String(formData.get("tacticId") ?? "");
    if (!title || !date || !startTime || !endTime || endTime <= startTime) return;
    updateState((draft) => draft.timeBlocks.push({ id: createId("block"), title, date, startTime, endTime, type, status: "planned", history: [], ...(tacticId ? { tacticId } : {}) }));
    setShowForm(false);
  }

  function updateBlockStatus(id: string, nextStatus: TimeBlockStatus) {
    updateState((draft) => {
      const block = draft.timeBlocks.find((item) => item.id === id);
      if (!block || block.status === nextStatus) return;
      const action: TimeBlockHistoryAction = nextStatus === "planned" ? "reopened" : nextStatus;
      block.status = nextStatus;
      if (!block.history) block.history = [];
      block.history.push({ id: createId("calendar-event"), action, at: new Date().toISOString(), fromDate: block.date, fromStartTime: block.startTime });
    });
  }

  function rescheduleBlock(formData: FormData) {
    const blockId = String(formData.get("blockId") ?? "");
    const date = String(formData.get("date") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    if (!blockId || !date || !startTime || !endTime || endTime <= startTime) return;
    updateState((draft) => {
      const block = draft.timeBlocks.find((item) => item.id === blockId);
      if (!block) return;
      const fromDate = block.date;
      const fromStartTime = block.startTime;
      if (fromDate === date && fromStartTime === startTime && block.endTime === endTime) return;
      block.date = date;
      block.startTime = startTime;
      block.endTime = endTime;
      block.status = "planned";
      if (!block.history) block.history = [];
      block.history.push({ id: createId("calendar-event"), action: "rescheduled", at: new Date().toISOString(), fromDate, toDate: date, fromStartTime, toStartTime: startTime });
    });
    setRescheduleBlockId(null);
  }

  const groups = Object.entries(
    state.timeBlocks
      .slice()
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
      .reduce<Record<string, typeof state.timeBlocks>>((result, block) => {
        (result[block.date] ??= []).push(block);
        return result;
      }, {}),
  );
  const calendarHistory = state.timeBlocks
    .flatMap((block) => (block.history ?? []).map((event) => ({ block, event })))
    .sort((a, b) => b.event.at.localeCompare(a.event.at));

  return (
    <>
      <PageHeader eyebrow="Performance Time" title="Calendar" description="Lập lịch và theo dõi các khối thời gian cho những việc quan trọng." action={<button className="primary-button" onClick={() => setShowForm((value) => !value)}><Clock3 size={17} /> Thêm khối thời gian</button>} />
      {showForm && <form className="panel inline-form" action={addBlock}><div className="form-grid three"><label className="field"><span>Nội dung</span><input name="title" required placeholder="Việc sẽ được bảo vệ trong lịch" /></label><label className="field"><span>Ngày</span><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><label className="field"><span>Loại khối</span><select name="type" defaultValue="strategic"><option value="strategic">Strategic</option><option value="buffer">Buffer</option><option value="breakout">Breakout</option></select></label><label className="field"><span>Bắt đầu</span><input name="startTime" type="time" required defaultValue="09:00" /></label><label className="field"><span>Kết thúc</span><input name="endTime" type="time" required defaultValue="10:30" /></label><label className="field"><span>Chiến thuật liên quan</span><select name="tacticId" defaultValue=""><option value="">Không gắn chiến thuật</option>{state.tactics.map((tactic) => <option value={tactic.id} key={tactic.id}>{tactic.title}</option>)}</select></label></div><div className="form-actions"><button type="button" className="quiet-button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary-button" type="submit">Thêm vào lịch</button></div></form>}

      <section className="calendar-board">
        {groups.map(([date, blocks]) => <article className="calendar-day panel" key={date}><div className="calendar-date"><span>{new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(new Date(`${date}T00:00:00`))}</span><strong>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T00:00:00`))}</strong></div><div className="block-list">{blocks.map((block) => { const status = block.status ?? "planned"; return <div className={`time-block ${block.type} ${status}`} key={block.id}><div className="time-range"><Clock3 size={15} /><span>{block.startTime}–{block.endTime}</span></div><div className="time-block-copy"><strong>{block.title}</strong><span>{blockLabels[block.type]}</span>{status !== "planned" && <span className={`time-status ${status}`}>{statusLabels[status]}</span>}</div><button className="icon-button danger" onClick={() => updateState((draft) => { draft.timeBlocks = draft.timeBlocks.filter((item) => item.id !== block.id); })} aria-label={`Xóa ${block.title}`}><Trash2 size={16} /></button><div className="time-block-actions"><button className={`calendar-action ${status === "completed" ? "active" : ""}`} onClick={() => updateBlockStatus(block.id, status === "completed" ? "planned" : "completed")}><Check size={14} /> {status === "completed" ? "Đặt lại" : "Hoàn thành"}</button><button className={`calendar-action ${status === "postponed" ? "active postponed" : ""}`} onClick={() => updateBlockStatus(block.id, status === "postponed" ? "planned" : "postponed")}><Clock3 size={14} /> {status === "postponed" ? "Đặt lại" : "Trì hoãn"}</button><button className="calendar-action" onClick={() => setRescheduleBlockId((current) => current === block.id ? null : block.id)}><CalendarClock size={14} /> Chuyển ngày</button></div>{rescheduleBlockId === block.id && <form className="reschedule-form" action={rescheduleBlock}><input type="hidden" name="blockId" value={block.id} /><label className="field"><span>Ngày mới</span><input type="date" name="date" required defaultValue={block.date} /></label><label className="field"><span>Bắt đầu</span><input type="time" name="startTime" required defaultValue={block.startTime} /></label><label className="field"><span>Kết thúc</span><input type="time" name="endTime" required defaultValue={block.endTime} /></label><button className="primary-button" type="submit">Lưu thay đổi</button></form>}</div>; })}</div></article>)}
        {!groups.length && <div className="panel empty-state"><Clock3 size={28} /><h3>No Time Blocks</h3><p>Đưa chiến thuật quan trọng vào lịch để cam kết có một thời điểm thực thi cụ thể.</p></div>}
      </section>

      <section className="panel calendar-history">
        <div className="section-title"><div><h2>Calendar Journal</h2></div><span className="soft-count">{calendarHistory.length} events</span></div>
        {calendarHistory.length ? <div className="calendar-history-list">{calendarHistory.map(({ block, event }) => <article className="calendar-history-row" key={event.id}><div><strong>{block.title}</strong><span>{historyActionLabels[event.action]}{event.action === "rescheduled" ? ` · ${formatDate(event.fromDate)} → ${formatDate(event.toDate ?? block.date)}` : ` · ${formatDate(event.fromDate)}`}</span></div><small>{formatDate(event.at)}</small></article>)}</div> : <p className="archive-empty">Chưa có lịch sử hoàn thành, trì hoãn hoặc chuyển ngày.</p>}
      </section>
    </>
  );
}
