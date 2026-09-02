import "server-only";

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createInitialPlannerState, type PlannerState } from "@twelve-cycle/domain";
import { plannerStateSchema } from "@/lib/planner-schema";

type PlannerRow = { data: unknown };
const globalForDatabase = globalThis as typeof globalThis & { plannerDatabase?: Promise<PGlite> };
const seedIds = {
  goals: new Set(["goal-1", "goal-2"]),
  tactics: new Set(["tactic-1", "tactic-2", "tactic-3"]),
  commitments: new Set(["commitment-1", "commitment-2", "commitment-3"]),
  timeBlocks: new Set(["block-1", "block-2"]),
  actionLogs: new Set(["action-1", "action-2", "action-3", "action-4", "action-5", "action-6", "action-7"]),
};
const seedCycleTitles = new Set(["12 Week Year", "Xây nền sản phẩm", "Xây nền sản phẩm gốc"]);

async function createDatabase() {
  const dataDirectory = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDirectory, { recursive: true });
  const database = await PGlite.create(dataDirectory);
  await database.query(`CREATE TABLE IF NOT EXISTS planner_states (
    user_id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  return database;
}

function getDatabase() {
  globalForDatabase.plannerDatabase ??= createDatabase();
  return globalForDatabase.plannerDatabase;
}

function migratePlannerState(input: unknown): PlannerState {
  if (!input || typeof input !== "object") return createInitialPlannerState();
  const legacy = structuredClone(input) as Record<string, unknown> & {
    cycle?: Record<string, unknown>;
    cycleHistory?: unknown[];
    visions?: unknown[];
    goals?: Array<Record<string, unknown>>;
    tactics?: Array<Record<string, unknown>>;
    commitments?: Array<Record<string, unknown>>;
    timeBlocks?: Array<Record<string, unknown>>;
    actionLogs?: unknown[];
  };
  const translations = new Map([
    ["Đưa MVP đến người dùng thật", "Đưa phiên bản đầu tiên đến người dùng thật"],
    ["Strategic Block — hoàn thiện sản phẩm", "Khối thời gian chiến lược — hoàn thiện sản phẩm"],
    ["Hoàn thiện onboarding", "Hoàn thiện hướng dẫn bắt đầu"],
    ["Email và công việc hành chính", "Thư và công việc hành chính"],
  ]);
  for (const collection of [legacy.goals, legacy.tactics, legacy.commitments, legacy.timeBlocks]) {
    for (const item of collection ?? []) {
      if (typeof item.title === "string" && translations.has(item.title)) item.title = translations.get(item.title);
    }
  }

  const normalizeTimeBlocks = (blocks?: unknown[]) => {
    for (const block of blocks ?? []) {
      if (!block || typeof block !== "object") continue;
      const item = block as Record<string, unknown>;
      if (typeof item.status !== "string") item.status = "planned";
      if (!Array.isArray(item.history)) item.history = [];
    }
  };
  normalizeTimeBlocks(legacy.timeBlocks);
  for (const archived of legacy.cycleHistory ?? []) {
    if (!archived || typeof archived !== "object") continue;
    const item = archived as Record<string, unknown>;
    normalizeTimeBlocks(Array.isArray(item.timeBlocks) ? item.timeBlocks : []);
  }

  const inferUnit = (title: unknown) => typeof title === "string" && /chiến lược|strategic|giờ|hour/i.test(title) ? "giờ" : typeof title === "string" && /vận động|buổi|phút|minute/i.test(title) ? "buổi" : "lần";
  const shouldInferUnit = (item: Record<string, unknown>) => typeof item.unit !== "string" || !item.unit.trim() || (item.unit === "lần" && typeof item.title === "string" && /khối thời gian chiến lược|strategic block|vận động tối thiểu/i.test(item.title));
  for (const tactic of legacy.tactics ?? []) if (shouldInferUnit(tactic)) tactic.unit = inferUnit(tactic.title);
  for (const commitment of legacy.commitments ?? []) if (shouldInferUnit(commitment)) commitment.unit = inferUnit(commitment.title);
  const validCommitmentIds = new Set((legacy.commitments ?? []).map((item) => item.id).filter((id): id is string => typeof id === "string"));
  const seedLogs = createInitialPlannerState().actionLogs.filter((log) => validCommitmentIds.has(log.commitmentId));
  const actionLogs = Array.isArray(legacy.actionLogs) ? legacy.actionLogs : seedLogs;

  if (legacy.cycle) delete legacy.cycle.vision;
  delete legacy.visions;
  const cycleHistory = Array.isArray(legacy.cycleHistory) ? legacy.cycleHistory : [];
  return plannerStateSchema.parse({ ...legacy, version: 7, cycleHistory, actionLogs });
}

function removeSeedData(state: PlannerState) {
  const next = structuredClone(state);
  next.goals = next.goals.filter((item) => !seedIds.goals.has(item.id));
  next.tactics = next.tactics.filter((item) => !seedIds.tactics.has(item.id));
  next.commitments = next.commitments.filter((item) => !seedIds.commitments.has(item.id));
  next.timeBlocks = next.timeBlocks.filter((item) => !seedIds.timeBlocks.has(item.id));
  next.actionLogs = next.actionLogs.filter((item) => !seedIds.actionLogs.has(item.id));

  let changed = next.goals.length !== state.goals.length
    || next.tactics.length !== state.tactics.length
    || next.commitments.length !== state.commitments.length
    || next.timeBlocks.length !== state.timeBlocks.length
    || next.actionLogs.length !== state.actionLogs.length;

  if (seedCycleTitles.has(next.cycle.title)) {
    const initialCycle = createInitialPlannerState().cycle;
    next.cycle = { ...next.cycle, title: initialCycle.title, why: initialCycle.why, startDate: initialCycle.startDate, currentWeek: initialCycle.currentWeek };
    changed = true;
  }

  if (changed && !next.goals.length && !next.tactics.length && !next.commitments.length && !next.timeBlocks.length && !next.reviews.length && !next.actionLogs.length && !next.cycleHistory.length) {
    next.cycle = createInitialPlannerState().cycle;
    next.profile = createInitialPlannerState().profile;
  }
  return { state: next, changed };
}

export async function getPlannerState(userId = "local-user"): Promise<PlannerState> {
  const database = await getDatabase();
  const result = await database.query<PlannerRow>("SELECT data FROM planner_states WHERE user_id = $1", [userId]);
  if (result.rows[0]?.data) {
    const persisted = result.rows[0].data;
    const migrated = migratePlannerState(persisted);
    const cleaned = removeSeedData(migrated);
    const nextState = cleaned.state;
    const persistedRecord = persisted && typeof persisted === "object" ? persisted as Record<string, unknown> : {};
    const persistedCycle = persistedRecord.cycle && typeof persistedRecord.cycle === "object" ? persistedRecord.cycle as Record<string, unknown> : {};
    const needsRewrite = persistedRecord.version !== nextState.version || "visions" in persistedRecord || "vision" in persistedCycle || cleaned.changed;
    if (needsRewrite) await savePlannerState(nextState, userId);
    return nextState;
  }
  const initialState = createInitialPlannerState();
  await savePlannerState(initialState, userId);
  return initialState;
}

export async function savePlannerState(state: PlannerState, userId = "local-user") {
  const database = await getDatabase();
  await database.query(
    `INSERT INTO planner_states (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [userId, JSON.stringify(state)],
  );
}
