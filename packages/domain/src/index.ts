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

export const CYCLE_WEEKS = 12;
export const CYCLE_DAYS = CYCLE_WEEKS * 7;

export function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function getCycleEndDate(startDate: string) {
  return addCalendarDays(startDate, CYCLE_DAYS - 1);
}

export function getCycleWeekStartDate(startDate: string, week: number) {
  return addCalendarDays(startDate, (Math.max(1, Math.min(CYCLE_WEEKS, week)) - 1) * 7);
}

export function getCycleWeekEndDate(startDate: string, week: number) {
  return addCalendarDays(getCycleWeekStartDate(startDate, week), 6);
}

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
    profile: { name: "User" },
    cycle: {
      id: "cycle-1",
      title: "12 Week Year",
      why: "",
      startDate: today,
      currentWeek: 1,
    },
    cycleHistory: [],
    goals: [],
    tactics: [],
    commitments: [],
    timeBlocks: [],
    reviews: [],
    actionLogs: [],
    updatedAt: isoNow,
  };
}
