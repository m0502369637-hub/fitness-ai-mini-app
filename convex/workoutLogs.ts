import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateInitData } from "./lib/telegram";

/**
 * Ticks/unticks one exercise in a plan for the authenticated user. Idempotent
 * per exercise (unique logKey), so the tick state survives across sessions and
 * feeds the day/week/month/year progress rollups.
 */
export const toggleExercise = mutation({
  args: {
    initData: v.string(),
    planId: v.id("workoutPlans"),
    dayIndex: v.number(),
    exerciseIndex: v.number(),
    exerciseId: v.optional(v.string()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const tgUser = await validateInitData(args.initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found");

    const logKey = `${args.planId}:${args.dayIndex}:${args.exerciseIndex}`;
    const existing = await ctx.db
      .query("exerciseLogs")
      .withIndex("by_logKey", (q) => q.eq("logKey", logKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        completedAt: Date.now(),
      });
      return { logId: existing._id };
    }

    const logId = await ctx.db.insert("exerciseLogs", {
      userId: user._id,
      planId: args.planId,
      dayIndex: args.dayIndex,
      exerciseIndex: args.exerciseIndex,
      exerciseId: args.exerciseId,
      completed: args.completed,
      completedAt: Date.now(),
      logKey,
    });
    return { logId };
  },
});

/** All completion logs for a user (drives the ticked state in the UI). */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("exerciseLogs")
      .withIndex("by_user_plan", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Completed-exercise counts for the current day, week, month, and all time.
 * This is the progress data the future AI coach will read.
 */
export const progressStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const logs = await ctx.db
      .query("exerciseLogs")
      .withIndex("by_user_plan", (q) => q.eq("userId", userId))
      .collect();
    const done = logs.filter((l) => l.completed);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = (since: number) => done.filter((l) => l.completedAt >= since).length;

    return {
      today: count(startOfDay.getTime()),
      week: count(startOfWeek.getTime()),
      month: count(startOfMonth.getTime()),
      all: done.length,
    };
  },
});
