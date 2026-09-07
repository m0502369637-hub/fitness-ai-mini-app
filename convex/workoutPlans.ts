import { v } from "convex/values";
import { query } from "./_generated/server";

/** Saved plans for one user, newest first. Reactive. */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("workoutPlans")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { planId: v.id("workoutPlans") },
  handler: async (ctx, { planId }) => {
    return await ctx.db.get(planId);
  },
});
