// convex/coach.ts
//
// The AI Coach. Text questions are answered by DeepSeek (OpenAI-compatible);
// body-photo analysis is routed to a vision-capable model through the model
// registry (see lib/models.ts). All calls are authenticated with the Telegram
// initData and charged against the user's points, with the conversation
// persisted so the coach keeps full context across sessions.
//
// Architecture note: LLM calls need `fetch`, which is only available in Convex
// *actions*. initData HMAC validation uses Web Crypto, which is available in
// queries/mutations. So the flow is:
//   action -> ctx.runMutation(checkInitData)  (validate + balance)
//          -> ctx.runQuery(getCoachContext)   (profile/progress/plans/history)
//          -> fetch(LLM)
//          -> ctx.runMutation(finalizeCoach)  (charge + persist)

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateInitData } from "./lib/telegram";
import { AI_COACH_COST } from "./lib/constants";
import { arrayBufferToDataUrl, chatCompletion, ChatMessage, routeModel, visionCompletion } from "./lib/models";
import { COACH_SYSTEM_PROMPT, PLAN_EDIT_SYSTEM_PROMPT, VISION_SYSTEM_PROMPT } from "./lib/prompts";
import { findCatalogExercise } from "./lib/exercises";

type CoachResult =
  | { ok: true; balance: number; response: string }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number }
  | { ok: false; reason: "LLM_NOT_CONFIGURED"; balance: number; required: number };

type ImageResult =
  | { ok: true; balance: number; response: string }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number }
  | { ok: false; reason: "VISION_NOT_CONFIGURED"; balance: number; required: number };

function buildChatMessages(
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>,
  contextBlock: string,
  message: string,
): ChatMessage[] {
  return [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    { role: "system", content: `Live user context (JSON):\n${contextBlock}` },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];
}

/** Ask the coach a question. Charges AI_COACH_COST on success. */
export const askCoach = action({
  args: { initData: v.string(), message: v.string() },
  handler: async (ctx, args): Promise<CoachResult> => {
    const { userId, balance, name } = await ctx.runMutation(internal.coachInternal.checkInitData, {
      initData: args.initData,
    });
    if (balance < AI_COACH_COST) {
      return {
        ok: false as const,
        reason: "INSUFFICIENT_POINTS" as const,
        balance,
        required: AI_COACH_COST,
      };
    }

    const model = routeModel({ vision: false });
    if (!model) {
      return { ok: false as const, reason: "LLM_NOT_CONFIGURED" as const, balance, required: 0 };
    }

    const context = await ctx.runQuery(internal.coachInternal.getCoachContext, { userId });
    const contextBlock = JSON.stringify(
      { userName: name, profile: context.profile, progress: context.progress, plans: context.plans },
      null,
      2,
    );
    const messages = buildChatMessages(context.recentMessages, contextBlock, args.message);
    const response = await chatCompletion(model, messages);

    const { balance: newBalance } = await ctx.runMutation(internal.coachInternal.finalizeCoach, {
      userId,
      cost: AI_COACH_COST,
      message: args.message,
      response,
    });

    return { ok: true as const, balance: newBalance, response };
  },
});

/** Generate a one-time upload URL for a body photo. */
export const generateUploadUrl = mutation({
  args: { initData: v.string() },
  handler: async (ctx, { initData }) => {
    const tgUser = await validateInitData(initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

/** Analyze an uploaded body/form photo with a vision-capable model. */
export const analyzeBodyImage = action({
  args: { initData: v.string(), storageId: v.id("_storage"), note: v.optional(v.string()) },
  handler: async (ctx, args): Promise<ImageResult> => {
    const { userId, balance } = await ctx.runMutation(internal.coachInternal.checkInitData, {
      initData: args.initData,
    });

    const model = routeModel({ vision: true });
    if (!model) {
      return {
        ok: false as const,
        reason: "VISION_NOT_CONFIGURED" as const,
        balance,
        required: 0,
      };
    }
    if (balance < AI_COACH_COST) {
      return {
        ok: false as const,
        reason: "INSUFFICIENT_POINTS" as const,
        balance,
        required: AI_COACH_COST,
      };
    }

    const imageUrl = await ctx.runQuery(internal.coachInternal.getStorageUrl, {
      storageId: args.storageId,
    });
    if (!imageUrl) throw new Error("Image not found");

    // The DeepSeek vision model can't download remote URLs, so fetch the stored
    // image here and pass it as a base64 data URL.
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) throw new Error("Could not download the uploaded image");
    const contentType = imageResp.headers.get("content-type") ?? "image/jpeg";
    const imageDataUrl = arrayBufferToDataUrl(contentType, await imageResp.arrayBuffer());

    const context = await ctx.runQuery(internal.coachInternal.getCoachContext, { userId });
    const userPrompt = `Analyze the attached photo for the user.\n\nProfile (JSON):\n${JSON.stringify(
      context.profile ?? {},
      null,
      2,
    )}\n\nUser note: ${args.note ?? "General body/form analysis"}`;

    const response = await visionCompletion(model, VISION_SYSTEM_PROMPT, imageDataUrl, userPrompt);

    const label = args.note ? `[Photo] ${args.note}` : "[Photo analysis]";
    const { balance: newBalance } = await ctx.runMutation(internal.coachInternal.finalizeCoach, {
      userId,
      cost: AI_COACH_COST,
      message: label,
      response,
    });

    return { ok: true as const, balance: newBalance, response };
  },
});

/** Persisted coach conversation for one user, oldest first. */
export const listMessages = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("coachMessages")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
      .order("asc")
      .take(100);
  },
});

// ---------------------------------------------------------------------------
// Plan editing (propose → user approves → apply)
// ---------------------------------------------------------------------------

interface PlanEditOperationLocal {
  type: "update" | "replace" | "add" | "remove";
  dayIndex: number;
  exerciseIndex?: number;
  name?: string;
  exerciseId?: string;
  sets?: number;
  reps?: string;
}

type PlanEditResultLocal =
  | { ok: true; balance: number; planId: string; proposal: { summary: string; operations: PlanEditOperationLocal[] } }
  | {
      ok: false;
      reason: "INSUFFICIENT_POINTS" | "LLM_NOT_CONFIGURED" | "NO_PLAN" | "INVALID_PROPOSAL";
      balance: number;
      required: number;
    };

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function strOrUndef(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let s = fenced ? fenced[1] : raw;
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeOperations(list: unknown): PlanEditOperationLocal[] | null {
  if (!Array.isArray(list)) return null;
  const ops: PlanEditOperationLocal[] = [];
  for (const o of list) {
    if (!o || typeof o !== "object") return null;
    const obj = o as Record<string, unknown>;
    const type = obj.type;
    const dayIndex = typeof obj.dayIndex === "number" ? obj.dayIndex : null;
    if (dayIndex === null || dayIndex < 0) return null;

    if (type === "update" || type === "remove") {
      const exerciseIndex = typeof obj.exerciseIndex === "number" ? obj.exerciseIndex : null;
      if (exerciseIndex === null || exerciseIndex < 0) return null;
      if (type === "update") {
        ops.push({
          type,
          dayIndex,
          exerciseIndex,
          sets: numOrUndef(obj.sets),
          reps: strOrUndef(obj.reps),
        });
      } else {
        ops.push({ type, dayIndex, exerciseIndex });
      }
    } else if (type === "replace" || type === "add") {
      const name = strOrUndef(obj.name);
      if (!name) return null;
      const base = {
        dayIndex,
        name,
        exerciseId: strOrUndef(obj.exerciseId),
        sets: numOrUndef(obj.sets),
        reps: strOrUndef(obj.reps),
      };
      if (type === "replace") {
        const exerciseIndex = typeof obj.exerciseIndex === "number" ? obj.exerciseIndex : null;
        if (exerciseIndex === null || exerciseIndex < 0) return null;
        ops.push({ type, exerciseIndex, ...base });
      } else {
        ops.push({ type, ...base });
      }
    } else {
      return null;
    }
  }
  return ops;
}

/** Ask the coach to propose a structured plan edit (charged, not yet applied). */
export const proposePlanEdit = action({
  args: { initData: v.string(), request: v.string() },
  handler: async (ctx, args): Promise<PlanEditResultLocal> => {
    const { userId, balance } = await ctx.runMutation(internal.coachInternal.checkInitData, {
      initData: args.initData,
    });
    if (balance < AI_COACH_COST) {
      return { ok: false, reason: "INSUFFICIENT_POINTS", balance, required: AI_COACH_COST };
    }

    const model = routeModel({ vision: false });
    if (!model) return { ok: false, reason: "LLM_NOT_CONFIGURED", balance, required: 0 };

    const planCtx = await ctx.runQuery(internal.coachInternal.getPlanEditContext, { userId });
    if (!planCtx.planId) return { ok: false, reason: "NO_PLAN", balance, required: 0 };

    const userPrompt = [
      "CURRENT PLAN (JSON):",
      JSON.stringify({ days: planCtx.days }, null, 2),
      "USER PROFILE (JSON):",
      JSON.stringify(
        {
          goal: planCtx.profile?.goal,
          level: planCtx.profile?.level,
          equipment: planCtx.profile?.equipment,
          limitations: planCtx.profile?.limitations,
        },
        null,
        2,
      ),
      "USER REQUEST:",
      args.request,
      "Return STRICT JSON only (no markdown, no prose).",
    ].join("\n");

    const raw = await chatCompletion(model, [
      { role: "system", content: PLAN_EDIT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    const parsed = extractJson(raw);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, reason: "INVALID_PROPOSAL", balance, required: 0 };
    }
    const operations = normalizeOperations((parsed as Record<string, unknown>).operations);
    if (!operations) {
      return { ok: false, reason: "INVALID_PROPOSAL", balance, required: 0 };
    }
    const summary =
      strOrUndef((parsed as Record<string, unknown>).summary) ?? "Plan update proposed";

    await ctx.runMutation(internal.coachInternal.chargePoints, {
      userId,
      cost: AI_COACH_COST,
      description: `-${AI_COACH_COST} Plan edit`,
    });

    return {
      ok: true,
      balance: balance - AI_COACH_COST,
      planId: planCtx.planId,
      proposal: { summary, operations },
    };
  },
});

/** Build a catalog-enriched exercise object for a plan day. */
function enrichExercise(name?: string, exerciseId?: string, sets?: number, reps?: string) {
  const cat = findCatalogExercise(exerciseId ?? name);
  return {
    name: name || cat?.name || "Exercise",
    sets: sets ?? 3,
    reps: reps ?? "8–12",
    exerciseId: cat?.id ?? exerciseId,
    primaryMuscles: cat?.primaryMuscles,
    secondaryMuscles: cat?.secondaryMuscles,
    equipment: cat?.equipment ?? undefined,
    level: cat?.level ?? undefined,
    images: cat?.images,
    instructions: cat?.instructions,
  };
}

/** Apply an approved set of plan edits (validates ownership, then patches days). */
export const applyPlanEdit = mutation({
  args: {
    initData: v.string(),
    planId: v.id("workoutPlans"),
    operations: v.array(
      v.object({
        type: v.union(
          v.literal("update"),
          v.literal("replace"),
          v.literal("add"),
          v.literal("remove"),
        ),
        dayIndex: v.number(),
        exerciseIndex: v.optional(v.number()),
        name: v.optional(v.string()),
        exerciseId: v.optional(v.string()),
        sets: v.optional(v.number()),
        reps: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tgUser = await validateInitData(args.initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found");

    const days = plan.days.map((d) => ({ day: d.day, exercises: d.exercises.map((e) => ({ ...e })) }));

    for (const op of args.operations) {
      const day = days[op.dayIndex];
      if (!day) continue;
      if (op.type === "update") {
        const ex = day.exercises[op.exerciseIndex ?? -1];
        if (!ex) continue;
        if (op.sets != null) ex.sets = op.sets;
        if (op.reps != null) ex.reps = op.reps;
      } else if (op.type === "replace") {
        const idx = op.exerciseIndex ?? -1;
        const old = day.exercises[idx];
        if (!old) continue;
        day.exercises[idx] = enrichExercise(
          op.name ?? old.name,
          op.exerciseId ?? old.exerciseId,
          op.sets ?? old.sets,
          op.reps ?? old.reps,
        );
      } else if (op.type === "add") {
        day.exercises.push(enrichExercise(op.name, op.exerciseId, op.sets, op.reps));
      } else if (op.type === "remove") {
        const idx = op.exerciseIndex ?? -1;
        if (idx >= 0 && idx < day.exercises.length) day.exercises.splice(idx, 1);
      }
    }

    await ctx.db.patch(args.planId, { days });
    return { ok: true as const };
  },
});
