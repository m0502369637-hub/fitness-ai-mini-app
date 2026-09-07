import { v } from "convex/values";
import { query } from "./_generated/server";

/** Point history for one user, newest first. Reactive. */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
