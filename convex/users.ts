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

/** Reactive read of the user's onboarding profile (questionnaire answers). */
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

const profileArgs = {
  initData: v.string(),
  goal: v.string(),
  level: v.string(),
  experience: v.string(),
  weeklyDays: v.number(),
  equipment: v.array(v.string()),
  heightCm: v.optional(v.number()),
  weightKg: v.optional(v.number()),
  targetWeightKg: v.optional(v.number()),
  age: v.optional(v.number()),
  gender: v.optional(v.string()),
  limitations: v.optional(v.string()),
  diet: v.optional(v.string()),
};

/**
 * Save (upsert) the onboarding questionnaire. Marks the user onboarded and, if
 * a language is provided, persists their UI language preference.
 */
export const saveProfile = mutation({
  args: { ...profileArgs, language: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tgUser = await validateInitData(args.initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const fields = {
      userId: user._id,
      goal: args.goal,
      level: args.level,
      experience: args.experience,
      weeklyDays: args.weeklyDays,
      equipment: args.equipment,
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      targetWeightKg: args.targetWeightKg,
      age: args.age,
      gender: args.gender,
      limitations: args.limitations,
      diet: args.diet,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("userProfiles", fields);
    }

    const patch: { onboarded: boolean; language?: string } = { onboarded: true };
    if (args.language) patch.language = args.language;
    await ctx.db.patch(user._id, patch);

    return { userId: user._id };
  },
});

/** Persist the user's UI language preference (en | ar). */
export const setLanguage = mutation({
  args: { initData: v.string(), language: v.string() },
  handler: async (ctx, { initData, language }) => {
    const tgUser = await validateInitData(initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { language });
    return { ok: true as const };
  },
});
