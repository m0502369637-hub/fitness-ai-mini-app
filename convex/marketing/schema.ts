// convex/marketing/schema.ts
//
// Marketing Engine tables ("Autonomous Marketing OS"). Kept as a standalone
// module so the whole engine is self-contained; convex/schema.ts merges these
// tables into the app schema with a spread.
//
//   marketingCampaigns      one row per campaign (captions + stored media)
//   marketingAssets         per-file records backing cleanup (storageId -> delete)
//   marketingLogs           engine audit trail (generation/distribution/cleanup)
//   marketingDistributions  per-channel delivery results (x/linkedin/instagram/tiktok/telegram)

import { defineTable } from "convex/server";
import { v } from "convex/values";

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

const distributionShape = {
  state: distributionState,
  totalUsers: v.number(),
  sentUsers: v.number(),
  failedUsers: v.number(),
};

export const marketingTables = {
  // One row per generated marketing campaign (text -> image -> video pipeline).
  marketingCampaigns: defineTable({
    theme: v.string(), // e.g. "30-day fitness transformation"
    topic: v.optional(v.string()), // e.g. "quick home workouts, no equipment"
    brandColor: v.optional(v.string()), // hex color fed into the image prompt
    platforms: v.array(v.string()), // "x" | "linkedin" | "instagram" | "tiktok"
    captions: v.record(v.string(), v.string()), // platform -> caption text
    hashtags: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.string()), // Convex File Storage id
    imageUrl: v.optional(v.string()), // public URL (storage.getUrl)
    videoStorageId: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    status: campaignStatus,
    error: v.optional(v.string()), // aggregated failure notes (pipeline keeps going)
    distribution: v.object(distributionShape),
    createdAt: v.number(),
    generatedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()), // set when distribution finishes; starts the 24h cleanup clock
  })
    .index("by_status", ["status"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  // One row per generated file. Cleanup walks these rows and calls
  // storage.delete(storageId) once the parent campaign is completed + 24h.
  marketingAssets: defineTable({
    campaignId: v.id("marketingCampaigns"),
    kind: v.union(v.literal("image"), v.literal("video")),
    storageId: v.string(),
    url: v.optional(v.string()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()), // set after storage.delete succeeds
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_deletedAt", ["deletedAt"]),

  // Engine audit trail. Every generation/distribution/cleanup step writes here;
  // failures never stop the rest of the pipeline.
  marketingLogs: defineTable({
    campaignId: v.optional(v.id("marketingCampaigns")),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    source: v.string(), // e.g. "generator.text.x", "distributor.instagram", "cleaner"
    message: v.string(),
    createdAt: v.number(),
  }).index("by_campaignId", ["campaignId"]),

  // Per-channel delivery results for one campaign.
  marketingDistributions: defineTable({
    campaignId: v.id("marketingCampaigns"),
    platform: v.string(), // "x" | "linkedin" | "instagram" | "tiktok" | "telegram"
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    error: v.optional(v.string()),
    externalId: v.optional(v.string()), // platform post id when the API returns one
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_campaignId", ["campaignId"]),
};
