import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateInitData } from "./lib/telegram";
import { resolveOrCreateUser } from "./lib/users";

/**
 * Called once on app launch. Validates initData, registers the user if new
 * (crediting the welcome bonus), and returns the user id + whether they are new
 * + their current balance.
 */
export const ensureUser = mutation({
  args: { initData: v.string() },
  handler: async (ctx, { initData }) => {
    const tgUser = await validateInitData(initData);
    const name =
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Athlete";

    const { userId, isNew, user } = await resolveOrCreateUser(
      ctx.db,
      String(tgUser.id),
      name,
      tgUser.username,
    );

    return { userId, isNew, balance: user.pointsBalance };
  },
});

/** Reactive read of a user document (drives the live balance display). */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/** Look a user up by their Telegram id (used by admin tooling, e.g. refunds). */
export const getByTgId = query({
  args: { tgId: v.string() },
  handler: async (ctx, { tgId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", tgId))
      .first();
  },
});
