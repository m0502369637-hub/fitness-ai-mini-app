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
 * Syncs the point packages with DEFAULT_PACKAGES — inserts missing ones, updates
 * changed prices, and deactivates anything no longer offered. Safe to run after
 * every deploy: `npx convex run packages:seed --prod`
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("pointPackages").collect();

    // Deactivate anything that is no longer offered.
    for (const existing of all) {
      const keep = DEFAULT_PACKAGES.some((p) => p.key === existing.key);
      if (!keep && existing.active) {
        await ctx.db.patch(existing._id, { active: false });
      }
    }

    for (const p of DEFAULT_PACKAGES) {
      const existing = await ctx.db
        .query("pointPackages")
        .withIndex("by_key", (q) => q.eq("key", p.key))
        .first();
      if (!existing) {
        await ctx.db.insert("pointPackages", { ...p, active: true });
      } else if (
        existing.title !== p.title ||
        existing.description !== p.description ||
        existing.points !== p.points ||
        existing.stars !== p.stars ||
        !existing.active
      ) {
        await ctx.db.patch(existing._id, { ...p, active: true });
      }
    }
  },
});
