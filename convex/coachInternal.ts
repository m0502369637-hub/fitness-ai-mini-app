// convex/coachInternal.ts
//
// Internal helpers for the AI coach, split into their own module so the public
// actions in coach.ts can reference them via `internal.coachInternal.*` without
// a self-referential type cycle.

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { validateInitData } from "./lib/telegram";

/** Validate initData + return the user and their current balance. */
export const checkInitData = internalMutation({
  args: { initData: v.string() },
  handler: async (ctx, { initData }) => {
    const tgUser = await validateInitData(initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found — open the app home screen first.");
    return { userId: user._id, balance: user.pointsBalance, name: user.name };
  },
});

/** Everything the coach needs to give contextual, personalized answers. */
export const getCoachContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const [profile, plans, logs, messages] = await Promise.all([
      ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first(),
      ctx.db
        .query("workoutPlans")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
        .order("desc")
        .take(3),
      ctx.db
        .query("exerciseLogs")
        .withIndex("by_user_plan", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("coachMessages")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
        .order("asc")
        .take(40),
    ]);

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
      profile,
      progress: {
        today: count(startOfDay.getTime()),
        week: count(startOfWeek.getTime()),
        month: count(startOfMonth.getTime()),
        all: done.length,
      },
      // Trim plans to the essentials so the prompt stays small.
      plans: plans.map((p) => ({
        title: p.title,
        goal: p.goal ?? null,
        level: p.level ?? null,
        days: p.days.map((d) => ({
          day: d.day,
          exercises: d.exercises.map((e) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            equipment: e.equipment ?? null,
            muscles: [...(e.primaryMuscles ?? []), ...(e.secondaryMuscles ?? [])],
          })),
        })),
      })),
      recentMessages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
  },
});

/** Charge the user, write the ledger entry, and persist both chat messages. */
export const finalizeCoach = internalMutation({
  args: {
    userId: v.id("users"),
    cost: v.number(),
    message: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const newBalance = user.pointsBalance - args.cost;
    await ctx.db.patch(args.userId, { pointsBalance: newBalance });
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.cost,
      type: "use_ai",
      description: `-${args.cost} AI Coach`,
      pointsAfter: newBalance,
      timestamp: Date.now(),
    });

    const now = Date.now();
    await ctx.db.insert("coachMessages", {
      userId: args.userId,
      role: "user",
      content: args.message,
      createdAt: now,
    });
    await ctx.db.insert("coachMessages", {
      userId: args.userId,
      role: "assistant",
      content: args.response,
      createdAt: now + 1,
    });

    return { balance: newBalance };
  },
});

/** Resolve a stored image to a public URL (called from the vision action). */
export const getStorageUrl = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});
