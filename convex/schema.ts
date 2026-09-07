import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User identity + live points balance
  users: defineTable({
    tgId: v.string(), // Telegram user id as string to avoid >2^53 precision loss
    name: v.string(),
    username: v.optional(v.string()),
    pointsBalance: v.number(),
    createdAt: v.number(), // ms epoch
  })
    .index("by_tgId", ["tgId"])
    .index("by_createdAt", ["createdAt"]),

  // Immutable ledger — every balance change (negative = spend, positive = credit)
  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("welcome"),
      v.literal("purchase"),
      v.literal("use_ai"),
      v.literal("use_plan"),
      v.literal("refund"),
    ),
    description: v.optional(v.string()),
    pointsAfter: v.number(), // running balance after this entry (audit trail)
    timestamp: v.number(),
    telegramPaymentChargeId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_chargeId", ["telegramPaymentChargeId"]),

  // Saved generated workout plans
  workoutPlans: defineTable({
    userId: v.id("users"),
    title: v.string(),
    goal: v.optional(v.string()),
    level: v.optional(v.string()),
    days: v.array(
      v.object({
        day: v.string(),
        exercises: v.array(
          v.object({
            name: v.string(),
            sets: v.number(),
            reps: v.string(),
          }),
        ),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // Point packages — server-side source of truth for prices (client can't tamper)
  pointPackages: defineTable({
    key: v.string(), // e.g. "pack_50"
    title: v.string(),
    description: v.string(),
    points: v.number(),
    stars: v.number(), // XTR amount
    active: v.boolean(),
  }).index("by_key", ["key"]),

  // Payment state for pre-checkout validation + reconciliation
  payments: defineTable({
    payload: v.string(), // unique invoice payload
    userId: v.id("users"),
    packageKey: v.string(),
    points: v.number(),
    stars: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("rejected"),
      v.literal("refunded"),
    ),
    telegramPaymentChargeId: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
  })
    .index("by_payload", ["payload"])
    .index("by_userId", ["userId"]),
});
