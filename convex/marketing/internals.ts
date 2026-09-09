// convex/marketing/internals.ts
//
// Database plumbing for the Marketing Engine. Convex *actions* cannot write to
// the database directly, so every read/write the actions need lives here as an
// internal mutation/query. Keeping them in one shared file (instead of inside
// each action module) avoids the self-referential `internal.*` import cycles
// that break TypeScript — the same split pattern as coach.ts / coachInternal.ts.

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

const campaignStatus = v.union(
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("distributing"),
  v.literal("completed"),
  v.literal("failed"),
);

const distributionState = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("done"),
  v.literal("failed"),
);

/** Append one entry to the marketing_logs audit trail. */
export const log = internalMutation({
  args: {
    campaignId: v.optional(v.id("marketingCampaigns")),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    source: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("marketingLogs", { ...args, createdAt: Date.now() });
  },
});

/** Create a campaign row in "generating" state. Returns the new id. */
export const createCampaign = internalMutation({
  args: {
    theme: v.string(),
    topic: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("marketingCampaigns", {
      theme: args.theme,
      topic: args.topic,
      brandColor: args.brandColor,
      platforms: args.platforms,
      captions: {},
      status: "generating",
      distribution: { state: "pending", totalUsers: 0, sentUsers: 0, failedUsers: 0 },
      createdAt: Date.now(),
    });
  },
});

/** Patch any subset of a campaign's progress fields (undefined keys skipped). */
export const updateCampaign = internalMutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    status: v.optional(campaignStatus),
    captions: v.optional(v.record(v.string(), v.string())),
    hashtags: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...patch } = args;
    const clean: Partial<Doc<"marketingCampaigns">> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) (clean as Record<string, unknown>)[key] = value;
    }
    if (Object.keys(clean).length > 0) {
      await ctx.db.patch(campaignId, clean);
    }
  },
});

/** Record a generated file (image/video) so cleanup can delete it later. */
export const saveAsset = internalMutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    kind: v.union(v.literal("image"), v.literal("video")),
    storageId: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("marketingAssets", { ...args, createdAt: Date.now() });
  },
});

/** Read one campaign document by id. */
export const getCampaign = internalQuery({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db.get(campaignId);
  },
});

/** Newest campaign whose assets are generated and waiting for distribution. */
export const getLatestReadyCampaign = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .order("desc")
      .first();
  },
});

/**
 * Newest campaign that has already been distributed — the source material for
 * daily repurposing on non-generation days (repost the latest drop instead of
 * paying for a fresh one).
 */
export const getLatestCompletedCampaign = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .first();
  },
});

/** Every app user (paginated) — the internal Telegram broadcast audience. */
export const listAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users: Array<{ _id: Id<"users">; tgId: string }> = [];
    let cursor: string | null = null;
    for (;;) {
      const page = await ctx.db
        .query("users")
        .order("desc")
        .paginate({ numItems: 200, cursor });
      users.push(...page.page.map((u) => ({ _id: u._id, tgId: u.tgId })));
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    return users;
  },
});

/** Mark a campaign as being distributed (blocks concurrent double-runs). */
export const markDistributing = internalMutation({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, { campaignId }) => {
    await ctx.db.patch(campaignId, {
      status: "distributing",
      distribution: { state: "running", totalUsers: 0, sentUsers: 0, failedUsers: 0 },
    });
  },
});

/** Checkpoint the Telegram broadcast progress (drives the campaign card). */
export const setDistributionProgress = internalMutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    totalUsers: v.number(),
    sentUsers: v.number(),
    failedUsers: v.number(),
  },
  handler: async (ctx, { campaignId, totalUsers, sentUsers, failedUsers }) => {
    await ctx.db.patch(campaignId, {
      distribution: { state: "running", totalUsers, sentUsers, failedUsers },
    });
  },
});

/** Finalize distribution: campaign becomes "completed" and the cleanup clock starts. */
export const finishCampaign = internalMutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    state: v.union(v.literal("done"), v.literal("failed")),
    totalUsers: v.number(),
    sentUsers: v.number(),
    failedUsers: v.number(),
  },
  handler: async (ctx, { campaignId, state, totalUsers, sentUsers, failedUsers }) => {
    await ctx.db.patch(campaignId, {
      status: "completed",
      completedAt: Date.now(),
      distribution: { state, totalUsers, sentUsers, failedUsers },
    });
  },
});

/** Upsert one per-platform distribution result row. */
export const upsertDistribution = internalMutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    platform: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    error: v.optional(v.string()),
    externalId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marketingDistributions")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("platform"), args.platform))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        error: args.error,
        externalId: args.externalId,
        sentAt: args.sentAt,
      });
    } else {
      await ctx.db.insert("marketingDistributions", { ...args, createdAt: Date.now() });
    }
  },
});

/** Read one per-platform distribution result row (used to skip already-sent channels). */
export const getDistribution = internalQuery({
  args: { campaignId: v.id("marketingCampaigns"), platform: v.string() },
  handler: async (ctx, { campaignId, platform }) => {
    return await ctx.db
      .query("marketingDistributions")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
      .filter((q) => q.eq(q.field("platform"), platform))
      .first();
  },
});

/**
 * Campaigns whose stored files are eligible for deletion:
 *  - "completed" campaigns older than 24h after completion (the spec), plus
 *  - "failed" campaigns older than 48h (partial assets from broken runs).
 * The newest completed campaign is always exempt: it is the source material
 * for daily repurposing on non-generation days, so its image/video must
 * survive until a newer campaign supersedes it.
 */
export const listCleanupCandidates = internalQuery({
  args: { cutoffMs: v.number() },
  handler: async (ctx, { cutoffMs }) => {
    const completed = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    const failed = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();
    const failedCutoff = cutoffMs - 24 * 60 * 60 * 1000;
    const latestCompleted = completed.sort((a, b) => b._creationTime - a._creationTime)[0];
    return [
      ...completed.filter(
        (c) =>
          c.completedAt !== undefined &&
          c.completedAt <= cutoffMs &&
          c._id !== latestCompleted?._id,
      ),
      ...failed.filter((c) => c.createdAt <= failedCutoff),
    ].map((c) => ({ _id: c._id, theme: c.theme, status: c.status }));
  },
});

/** Stored files of a campaign that have not been deleted yet. */
export const listUndeletedAssets = internalQuery({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db
      .query("marketingAssets")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/** Mark one asset row as deleted after storage.delete succeeded. */
export const markAssetDeleted = internalMutation({
  args: { assetId: v.id("marketingAssets") },
  handler: async (ctx, { assetId }) => {
    await ctx.db.patch(assetId, { deletedAt: Date.now() });
  },
});
