import { z } from "zod";

const goalSchema = z.object({ id: z.string().min(1), title: z.string().min(1).max(160), why: z.string().max(1000), target: z.number().nonnegative(), current: z.number().nonnegative(), unit: z.string().min(1).max(80) });
const cycleSchema = z.object({ id: z.string().min(1), title: z.string().min(1).max(160), why: z.string().max(2000), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), currentWeek: z.number().int().min(1).max(12) });
const unitSchema = z.string().trim().min(1).max(40);
const tacticSchema = z.object({ id: z.string().min(1), goalId: z.string().min(1), title: z.string().min(1).max(200), targetPerWeek: z.number().positive().max(1000), unit: unitSchema, scheduledDays: z.array(z.number().int().min(1).max(7)).max(7) });
const commitmentSchema = z.object({ id: z.string().min(1), tacticId: z.string().min(1), goalId: z.string().min(1), title: z.string().min(1).max(200), target: z.number().positive().max(1000), completed: z.number().nonnegative().max(1000), unit: unitSchema });
const actionLogSchema = z.object({ id: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), week: z.number().int().min(1).max(12), commitmentId: z.string().min(1), amount: z.number().positive().max(1000) });
const timeBlockHistorySchema = z.object({ id: z.string().min(1), action: z.enum(["completed", "postponed", "rescheduled", "reopened"]), at: z.string().datetime(), fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), fromStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), toStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional() });
const timeBlockSchema = z.object({ id: z.string().min(1), title: z.string().min(1).max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), type: z.enum(["strategic", "buffer", "breakout"]), tacticId: z.string().optional(), status: z.enum(["planned", "completed", "postponed"]), history: z.array(timeBlockHistorySchema).max(100) });
const reviewSchema = z.object({ id: z.string().min(1), week: z.number().int().min(1).max(12), score: z.number().int().min(0).max(100), wins: z.string().max(3000), breakdowns: z.string().max(3000), lessons: z.string().max(3000), adjustment: z.string().max(3000), createdAt: z.string().datetime() });

export const plannerStateSchema = z.object({
  version: z.literal(7),
  profile: z.object({ name: z.string().min(1).max(80) }),
  cycle: cycleSchema,
  cycleHistory: z.array(z.object({
    id: z.string().min(1),
    cycle: cycleSchema,
    goals: z.array(goalSchema).max(3),
    tactics: z.array(tacticSchema).max(100),
    commitments: z.array(commitmentSchema).max(100),
    timeBlocks: z.array(timeBlockSchema).max(500),
    reviews: z.array(reviewSchema).max(12),
    actionLogs: z.array(actionLogSchema).max(2000),
    archivedAt: z.string().datetime(),
  })).max(100),
  goals: z.array(goalSchema).max(3),
  tactics: z.array(tacticSchema).max(100),
  commitments: z.array(commitmentSchema).max(100),
  timeBlocks: z.array(timeBlockSchema).max(500),
  reviews: z.array(reviewSchema).max(12),
  actionLogs: z.array(actionLogSchema).max(2000),
  updatedAt: z.string().datetime(),
});
