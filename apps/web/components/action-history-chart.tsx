"use client";

import { useMemo, useState } from "react";
import type { ActionLog, WeeklyCommitment } from "@twelve-cycle/domain";

type Period = "day" | "week";
type ChartEntry = { key: string; label: string; value: number; detail: string };

// A restrained green palette keeps the chart aligned with the product theme.
const colors = ["#254d3c", "#52745c", "#719b72", "#9ab88d", "#b7c964", "#7f9e87", "#d1dc9c"];

function offsetDate(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function mondayOffset(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? -6 : 1 - day;
}

function formatAmount(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatWeekday(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  return value.getUTCDay() === 0 ? "Chủ nhật" : new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(value);
}

function describeRingSegment(start: number, end: number, outerRadius = 100, innerRadius = 62) {
  const point = (radius: number, angle: number) => [150 + radius * Math.cos(angle), 150 + radius * Math.sin(angle)];
  const [outerStartX, outerStartY] = point(outerRadius, start);
  const [outerEndX, outerEndY] = point(outerRadius, end);
  const [innerEndX, innerEndY] = point(innerRadius, end);
  const [innerStartX, innerStartY] = point(innerRadius, start);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`;
}

export function ActionHistoryChart({ logs, commitments, currentWeek }: { logs: ActionLog[]; commitments: WeeklyCommitment[]; currentWeek: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<Period>("day");
  const [selectedKey, setSelectedKey] = useState(today);
  const commitmentMap = useMemo(() => new Map(commitments.map((item) => [item.id, item])), [commitments]);
  const entries = useMemo<ChartEntry[]>(() => {
    if (period === "day") {
      return Array.from({ length: 7 }, (_, index) => {
        const date = offsetDate(today, mondayOffset(today) + index);
        const dateValue = logs.filter((log) => log.date === date).length;
        return { key: date, label: formatWeekday(date), value: dateValue, detail: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T00:00:00`)) };
      });
    }
    const firstWeek = Math.max(1, currentWeek - 3);
    return Array.from({ length: currentWeek - firstWeek + 1 }, (_, index) => {
      const week = firstWeek + index;
      const weekValue = logs.filter((log) => log.week === week).length;
      return { key: `week-${week}`, label: `Tuần ${week}`, value: weekValue, detail: "trong chu kỳ hiện tại" };
    });
  }, [currentWeek, logs, period, today]);

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const fallbackKey = period === "day" ? today : `week-${currentWeek}`;
  const selected = entries.find((entry) => entry.key === selectedKey) ?? entries.find((entry) => entry.key === fallbackKey) ?? entries.at(-1);
  const selectedLogs = selected ? logs.filter((log) => period === "day" ? log.date === selected.key : log.week === Number(selected.key.replace("week-", ""))) : [];
  const selectedDetails = selectedLogs.reduce((result, log) => {
    const commitment = commitmentMap.get(log.commitmentId);
    if (!commitment) return result;
    const existing = result.find((item) => item.title === commitment.title);
    if (existing) existing.amount += log.amount;
    else result.push({ title: commitment.title, amount: log.amount, unit: commitment.unit });
    return result;
  }, [] as Array<{ title: string; amount: number; unit: string }>);
  const chartValues = total > 0 ? entries.map((entry) => entry.value) : entries.map(() => 1);
  const chartTotal = chartValues.reduce((sum, value) => sum + value, 0);
  let angle = -Math.PI / 2;

  return (
    <section className="panel action-history" aria-labelledby="action-history-title">
      <div className="panel-header"><div><h3 id="action-history-title">Action History</h3></div><div className="period-switch" role="group" aria-label="Khoảng thời gian thống kê"><button className={period === "day" ? "active" : ""} onClick={() => { setPeriod("day"); setSelectedKey(today); }}>1 tuần</button><button className={period === "week" ? "active" : ""} onClick={() => { setPeriod("week"); setSelectedKey(`week-${currentWeek}`); }}>4 tuần</button></div></div>
      <div className="history-chart-layout">
        <div className="donut-wrap">
          <svg className="donut-chart" viewBox="0 0 300 300" aria-label={`Biểu đồ lịch sử hành động theo ${period === "day" ? "ngày" : "tuần"}`}>
            {entries.map((entry, index) => {
              const start = angle;
              angle += (chartValues[index] / chartTotal) * Math.PI * 2;
              if (!entry.value && total > 0) return null;
              return <path key={entry.key} className={selected?.key === entry.key ? "selected" : ""} d={describeRingSegment(start, angle - 0.018)} fill={colors[index % colors.length]} tabIndex={0} role="button" aria-label={`${entry.label}: ${formatAmount(entry.value)} hành động`} onClick={() => setSelectedKey(entry.key)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedKey(entry.key); }} />;
            })}
          </svg>
          <div className="donut-total"><strong>{formatAmount(total)}</strong><span>hành động đã ghi</span></div>
        </div>
        <div className="history-detail"><h4>{selected?.label} · {selected?.detail}</h4>{selectedDetails.length ? <ul>{selectedDetails.map((item) => <li key={item.title}><span>{item.title}</span><strong>{formatAmount(item.amount)} {item.unit}</strong></li>)}</ul> : <p>Chưa có nhật ký hành động trong khoảng này.</p>}</div>
      </div>
      <div className="history-legend">{entries.map((entry, index) => <button key={entry.key} className={selected?.key === entry.key ? "active" : ""} onClick={() => setSelectedKey(entry.key)}><i style={{ background: colors[index % colors.length] }} /> <span>{entry.label}</span><strong>{formatAmount(entry.value)}</strong></button>)}</div>
    </section>
  );
}
