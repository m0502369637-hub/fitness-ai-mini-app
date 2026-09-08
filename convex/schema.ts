import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { marketingTables } from "./marketing/schema";

export default defineSchema({
  // User identity + live points balance
  users: defineTable({
    tgId: v.string(), // Telegram user id as string to avoid >2^53 precision loss
    name: v.string(),
    username: v.optional(v.string()),
    pointsBalance: v.number(),
    createdAt: v.number(), // ms epoch
    onboarded: v.optional(v.boolean()), // onboarding questionnaire completed?
    language: v.optional(v.string()), // "en" | "ar"
  })
    .index("by_tgId", ["tgId"])
    .index("by_createdAt", ["createdAt"]),

  // Onboarding questionnaire answers — the structured profile the AI coach reads
  // to personalize plans and advice.
  userProfiles: defineTable({
    userId: v.id("users"),
    goal: v.string(), // muscle_gain | fat_loss | endurance | general
    level: v.string(), // beginner | intermediate | advanced
    experience: v.string(), // new | some | experienced
    weeklyDays: v.number(), // training days per week
    equipment: v.array(v.string()), // available equipment
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    targetWeightKg: v.optional(v.number()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    limitations: v.optional(v.string()), // injuries / mobility notes
    diet: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Persisted coach conversation so the AI keeps full context across sessions.
  coachMessages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_userId_createdAt", ["userId", "createdAt"]),

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
    durationWeeks: v.optional(v.number()), // program length, max 8 weeks (two months)
    startDate: v.optional(v.number()), // ms epoch — chosen start of the program
    endDate: v.optional(v.number()), // ms epoch — chosen end (span ≤ 8 weeks)
    days: v.array(
      v.object({
        day: v.string(),
        exercises: v.array(
          v.object({
            name: v.string(),
            sets: v.number(),
            reps: v.string(),
            exerciseId: v.optional(v.string()),
            primaryMuscles: v.optional(v.array(v.string())),
            secondaryMuscles: v.optional(v.array(v.string())),
            equipment: v.optional(v.string()),
            level: v.optional(v.string()),
            images: v.optional(v.array(v.string())),
            instructions: v.optional(v.array(v.string())),
          }),
        ),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // User-submitted feature requests from the Profile page.
  featureRequests: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    contact: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Per-exercise completion tracking (tick/untick) for a user's plan.
  exerciseLogs: defineTable({
    userId: v.id("users"),
    planId: v.id("workoutPlans"),
    dayIndex: v.number(),
    exerciseIndex: v.number(),
    exerciseId: v.optional(v.string()),
    completed: v.boolean(),
    completedAt: v.number(),
    logKey: v.string(), // `${planId}:${dayIndex}:${exerciseIndex}` — unique per exercise
  })
    .index("by_user_plan", ["userId", "planId"])
    .index("by_user_completedAt", ["userId", "completedAt"])
    .index("by_logKey", ["logKey"]),

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

  // Marketing Engine tables — defined in convex/marketing/schema.ts.
  ...marketingTables,
});
