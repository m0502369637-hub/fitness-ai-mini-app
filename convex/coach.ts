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
import { COACH_SYSTEM_PROMPT, VISION_SYSTEM_PROMPT } from "./lib/prompts";

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
