import { mutation, query } from "./_generated/server";
import { DEFAULT_PACKAGES } from "./lib/constants";

/** Active point packages, cheapest first. Reactive. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const pkgs = await ctx.db.query("pointPackages").collect();
    return pkgs.filter((p) => p.active).sort((a, b) => a.stars - b.stars);
  },
});

/**
 * Seeds the default point packages. Idempotent — safe to run multiple times.
 * Run once after first deploy: `npx convex run packages:seed`
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const p of DEFAULT_PACKAGES) {
      const existing = await ctx.db
        .query("pointPackages")
        .withIndex("by_key", (q) => q.eq("key", p.key))
        .first();
      if (!existing) {
        await ctx.db.insert("pointPackages", { ...p, active: true });
      }
    }
  },
});
