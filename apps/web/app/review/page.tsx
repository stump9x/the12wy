"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { calculateCalendarPenalty, calculateExecutionScore } from "@twelve-cycle/domain";
import { createId, usePlanner } from "@/components/planner-provider";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";

type ReviewDraft = { wins: string; breakdowns: string; lessons: string; adjustment: string };
const emptyDraft: ReviewDraft = { wins: "", breakdowns: "", lessons: "", adjustment: "" };

export default function ReviewPage() {
  const { state, updateState } = usePlanner();
  const [draft, setDraft] = useState<ReviewDraft>(emptyDraft);
  const [notice, setNotice] = useState("");
  const week = state?.cycle.currentWeek ?? 1;
  const currentReview = state?.reviews.find((review) => review.week === week);

  useEffect(() => {
    if (currentReview) setDraft({ wins: currentReview.wins, breakdowns: currentReview.breakdowns, lessons: currentReview.lessons, adjustment: currentReview.adjustment });
  }, [currentReview]);

  if (!state) return <LoadingState />;
  const calendarPenalty = calculateCalendarPenalty(state.timeBlocks);
  const score = calculateExecutionScore(state.commitments, state.timeBlocks);

  function saveReview() {
    updateState((next) => {
      const review = next.reviews.find((item) => item.week === week);
      if (review) Object.assign(review, draft, { score, createdAt: new Date().toISOString() });
      else next.reviews.push({ id: createId("review"), week, score, ...draft, createdAt: new Date().toISOString() });
    });
    setNotice("Đánh giá tuần đã được lưu.");
    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <>
      <PageHeader eyebrow={`Week ${week} / 12`} title="Weekly Review" description="Đối diện sự thật: ghi nhận kết quả, nhìn thẳng vào điểm đứt gãy và quyết định điều chỉnh cho tuần tiếp theo." />
      {notice && <div className="toast" role="status"><CheckCircle2 size={17} /> {notice}</div>}
      <section className="review-layout">
        <article className="panel review-score"><span className="eyebrow">Execution Score</span><div className="score-ring xlarge" style={{ "--score": `${score}%` } as React.CSSProperties}><span>{score}%</span></div><h3>{score >= 85 ? "Commitments on Track" : "Data for Adjustment, Not Judgment"}</h3><p>Điểm được tính từ {state.commitments.length} chiến thuật dẫn dắt trong kế hoạch tuần.{calendarPenalty > 0 && ` Calendar penalty: −${calendarPenalty} points.`}</p></article>
        <article className="panel review-form"><div className="review-question"><label htmlFor="wins">1. Điều gì đã diễn ra tốt?</label><textarea id="wins" rows={3} value={draft.wins} onChange={(event) => setDraft((current) => ({ ...current, wins: event.target.value }))} placeholder="Thành tựu, hành động hiệu quả, điều đáng ghi nhận…" /></div><div className="review-question"><label htmlFor="breakdowns">2. Cam kết nào bị bỏ qua và vì sao?</label><textarea id="breakdowns" rows={3} value={draft.breakdowns} onChange={(event) => setDraft((current) => ({ ...current, breakdowns: event.target.value }))} placeholder="Mô tả sự thật, không đổ lỗi…" /></div><div className="review-question"><label htmlFor="lessons">3. Bạn học được điều gì?</label><textarea id="lessons" rows={3} value={draft.lessons} onChange={(event) => setDraft((current) => ({ ...current, lessons: event.target.value }))} placeholder="Mô thức, rào cản hoặc điều vừa nhận ra…" /></div><div className="review-question"><label htmlFor="adjustment">4. Tuần sau sẽ điều chỉnh điều gì?</label><textarea id="adjustment" rows={3} value={draft.adjustment} onChange={(event) => setDraft((current) => ({ ...current, adjustment: event.target.value }))} placeholder="Một thay đổi cụ thể và nằm trong tầm kiểm soát…" /></div><button className="primary-button full" onClick={saveReview}><Save size={17} /> Lưu đánh giá tuần</button></article>
      </section>
      {!!state.reviews.length && <section className="module-section"><div className="section-title"><div><h2>Review Journal</h2></div></div><div className="review-history">{state.reviews.slice().sort((a, b) => b.week - a.week).map((review) => <article className="panel" key={review.id}><span>Week {review.week}</span><strong>{review.score}%</strong><p>{review.adjustment || "Chưa ghi điều chỉnh."}</p></article>)}</div></section>}
    </>
  );
}
