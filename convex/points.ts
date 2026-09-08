import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { PLAN_COST } from "./lib/constants";
import { generateMockPlan } from "./lib/mock";
import { validateInitData } from "./lib/telegram";

/**
 * Workout plan generation — charges PLAN_COST points, generates a (mock) plan,
 * and saves it to workoutPlans, all atomically.
 */
export const generatePlan = mutation({
  args: { initData: v.string(), goal: v.string(), level: v.string() },
  handler: async (ctx, { initData, goal, level }) => {
    const tgUser = await validateInitData(initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found — open the app home screen first.");

    if (user.pointsBalance < PLAN_COST) {
      return {
        ok: false as const,
        reason: "INSUFFICIENT_POINTS" as const,
        balance: user.pointsBalance,
        required: PLAN_COST,
      };
    }

    const newBalance = user.pointsBalance - PLAN_COST;
    await ctx.db.patch(user._id, { pointsBalance: newBalance });
    await ctx.db.insert("transactions", {
      userId: user._id,
      amount: -PLAN_COST,
      type: "use_plan",
      description: `-${PLAN_COST} Workout Plan`,
      pointsAfter: newBalance,
      timestamp: Date.now(),
    });

    const generated = generateMockPlan(goal, level);
    const planId = await ctx.db.insert("workoutPlans", {
      userId: user._id,
      title: generated.title,
      goal,
      level,
      durationWeeks: generated.durationWeeks,
      days: generated.days,
      createdAt: Date.now(),
    });

    return {
      ok: true as const,
      balance: newBalance,
      plan: {
        _id: planId,
        title: generated.title,
        durationWeeks: generated.durationWeeks,
        days: generated.days,
      },
    };
  },
});
