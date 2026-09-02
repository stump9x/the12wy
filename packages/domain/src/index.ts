export type TimeBlockType = "strategic" | "buffer" | "breakout";
export type TimeBlockStatus = "planned" | "completed" | "postponed";
export type TimeBlockHistoryAction = "completed" | "postponed" | "rescheduled" | "reopened";

export type TimeBlockHistoryEntry = {
  id: string;
  action: TimeBlockHistoryAction;
  at: string;
  fromDate: string;
  toDate?: string;
  fromStartTime?: string;
  toStartTime?: string;
};

export type Cycle = {
  id: string;
  title: string;
  why: string;
  startDate: string;
  currentWeek: number;
};

export type Goal = {
  id: string;
  title: string;
  why: string;
  target: number;
  current: number;
  unit: string;
};

export type Tactic = {
  id: string;
  goalId: string;
  title: string;
  targetPerWeek: number;
  unit: string;
  scheduledDays: number[];
};

export type WeeklyCommitment = {
  id: string;
  tacticId: string;
  goalId: string;
  title: string;
  target: number;
  completed: number;
  unit: string;
};

export type TimeBlock = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: TimeBlockType;
  tacticId?: string;
  status: TimeBlockStatus;
  history: TimeBlockHistoryEntry[];
};

export type WeeklyReview = {
  id: string;
  week: number;
  score: number;
  wins: string;
  breakdowns: string;
  lessons: string;
  adjustment: string;
  createdAt: string;
};

export type ActionLog = {
  id: string;
  date: string;
  week: number;
  commitmentId: string;
  amount: number;
};

export type ArchivedCycle = {
  id: string;
  cycle: Cycle;
  goals: Goal[];
  tactics: Tactic[];
  commitments: WeeklyCommitment[];
  timeBlocks: TimeBlock[];
  reviews: WeeklyReview[];
  actionLogs: ActionLog[];
  archivedAt: string;
};

export type PlannerState = {
  version: 7;
  profile: { name: string };
  cycle: Cycle;
  cycleHistory: ArchivedCycle[];
  goals: Goal[];
  tactics: Tactic[];
  commitments: WeeklyCommitment[];
  timeBlocks: TimeBlock[];
  reviews: WeeklyReview[];
  actionLogs: ActionLog[];
  updatedAt: string;
};

export type WeeklyTactic = Pick<WeeklyCommitment, "id" | "title" | "target" | "completed">;

export function calculateCalendarPenalty(timeBlocks: TimeBlock[]): number {
  const penalty = timeBlocks.reduce((total, block) => total + (block.history ?? []).reduce((blockPenalty, event) => {
    if (event.action === "postponed") return blockPenalty + 5;
    if (event.action === "rescheduled") return blockPenalty + 3;
    return blockPenalty;
  }, 0), 0);
  return Math.min(20, penalty);
}

export function calculateExecutionScore(tactics: WeeklyTactic[], timeBlocks: TimeBlock[] = []): number {
  const totals = tactics.reduce(
    (result, tactic) => ({
      committed: result.committed + Math.max(0, tactic.target),
      completed:
        result.completed + Math.min(Math.max(0, tactic.completed), Math.max(0, tactic.target)),
    }),
    { committed: 0, completed: 0 },
  );

  if (totals.committed === 0) return 0;
  const baseScore = Math.round((totals.completed / totals.committed) * 100);
  return Math.max(0, baseScore - calculateCalendarPenalty(timeBlocks));
}

export function calculateGoalProgress(goal: Goal): number {
  if (goal.target <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, goal.current) / goal.target) * 100));
}

export function createInitialPlannerState(now = new Date()): PlannerState {
  const isoNow = now.toISOString();
  const today = isoNow.slice(0, 10);

  return {
    version: 7,
    profile: { name: "Kevin" },
    cycle: {
      id: "cycle-1",
      title: "Xây nền sản phẩm",
      why: "Tạo ra một hệ thống đủ đơn giản để duy trì, nhưng đủ trung thực để tạo ra tiến bộ thật.",
      startDate: today,
      currentWeek: 5,
    },
    cycleHistory: [],
    goals: [
      {
        id: "goal-1",
        title: "Đưa phiên bản đầu tiên đến người dùng thật",
        why: "Kiểm chứng vấn đề và vòng lặp thực thi trước khi mở rộng sản phẩm.",
        target: 50,
        current: 10,
        unit: "người dùng kích hoạt",
      },
      {
        id: "goal-2",
        title: "Duy trì năng lượng bền vững",
        why: "Hiệu suất cao cần sức khỏe và khoảng nghỉ có chủ đích.",
        target: 36,
        current: 13,
        unit: "buổi vận động",
      },
    ],
    tactics: [
      { id: "tactic-1", goalId: "goal-1", title: "Phỏng vấn người dùng mục tiêu", targetPerWeek: 3, unit: "lần", scheduledDays: [2, 4, 6] },
      { id: "tactic-2", goalId: "goal-1", title: "Khối thời gian chiến lược — hoàn thiện sản phẩm", targetPerWeek: 4, unit: "giờ", scheduledDays: [2, 3, 5, 6] },
      { id: "tactic-3", goalId: "goal-2", title: "Vận động tối thiểu 30 phút", targetPerWeek: 3, unit: "buổi", scheduledDays: [2, 4, 7] },
    ],
    commitments: [
      { id: "commitment-1", tacticId: "tactic-1", goalId: "goal-1", title: "Phỏng vấn người dùng mục tiêu", target: 3, completed: 2, unit: "lần" },
      { id: "commitment-2", tacticId: "tactic-2", goalId: "goal-1", title: "Khối thời gian chiến lược — hoàn thiện sản phẩm", target: 4, completed: 3, unit: "giờ" },
      { id: "commitment-3", tacticId: "tactic-3", goalId: "goal-2", title: "Vận động tối thiểu 30 phút", target: 3, completed: 2, unit: "buổi" },
    ],
    timeBlocks: [
      { id: "block-1", title: "Hoàn thiện hướng dẫn bắt đầu", date: today, startTime: "09:00", endTime: "10:30", type: "strategic", tacticId: "tactic-2", status: "planned", history: [] },
      { id: "block-2", title: "Thư và công việc hành chính", date: today, startTime: "14:00", endTime: "14:30", type: "buffer", status: "planned", history: [] },
    ],
    reviews: [],
    actionLogs: [
      { id: "action-1", date: offsetDate(today, -6), week: 4, commitmentId: "commitment-1", amount: 1 },
      { id: "action-2", date: offsetDate(today, -5), week: 4, commitmentId: "commitment-2", amount: 1.5 },
      { id: "action-3", date: offsetDate(today, -4), week: 4, commitmentId: "commitment-1", amount: 1 },
      { id: "action-4", date: offsetDate(today, -3), week: 5, commitmentId: "commitment-3", amount: 1 },
      { id: "action-5", date: offsetDate(today, -2), week: 5, commitmentId: "commitment-2", amount: 1 },
      { id: "action-6", date: offsetDate(today, -1), week: 5, commitmentId: "commitment-1", amount: 1 },
      { id: "action-7", date: today, week: 5, commitmentId: "commitment-3", amount: 1 },
    ],
    updatedAt: isoNow,
  };
}

function offsetDate(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
