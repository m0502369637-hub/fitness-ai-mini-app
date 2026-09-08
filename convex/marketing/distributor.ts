// convex/marketing/distributor.ts
//
// Global distribution for a "ready" campaign:
//
//   External — each platform is posted through Composio's action-execution API
//              (POST /api/v2/actions/{action}/execute). Every platform is
//              isolated: a failed X post never blocks LinkedIn/Instagram/TikTok.
//   Internal — the campaign is broadcast to every app user through the Telegram
//              Bot API in batches of 25 users/second (Telegram's global limit
//              is ~30 messages/sec, so 25/s leaves headroom).
//
// Media is always passed to external APIs as the PUBLIC URL from
// storage.getUrl() — external services cannot read internal storage ids.
//
// All database writes go through convex/marketing/internals.ts.

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

const COMPOSIO_BASE = "https://backend.composio.dev/api/v2";
const TELEGRAM_BATCH_SIZE = 25; // users per batch
const TELEGRAM_BATCH_INTERVAL_MS = 1000; // 1s per batch => 25 msg/sec (< 30/s global cap)
const TELEGRAM_CAPTION_LIMIT = 900; // sendPhoto caption hard limit is 1024

const DEFAULT_ACTIONS: Record<string, string> = {
  x: "TWITTER_CREATE_TWEET",
  linkedin: "LINKEDIN_CREATE_LINKED_IN_POST",
  instagram: "INSTAGRAM_MEDIA_CREATE",
  tiktok: "TIKTOK_POST_VIDEO",
};

type LogLevel = "info" | "warn" | "error";
type ChannelOutcome = { status: "sent" | "failed" | "skipped"; error?: string };
type TelegramStats = ChannelOutcome & { total: number; sent: number; failed: number };

type DistributionResult =
  | { ok: true; campaignId: Id<"marketingCampaigns">; results: Record<string, ChannelOutcome>; telegram: TelegramStats }
  | { ok: false; reason: "MARKETING_DISABLED" | "NO_READY_CAMPAIGN" | "ALREADY_DISTRIBUTING" | "ALL_CHANNELS_FAILED" };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function envKey(platform: string): string {
  return `COMPOSIO_CONNECTED_ACCOUNT_ID_${platform.toUpperCase()}`;
}

function actionEnvKey(platform: string): string {
  return `COMPOSIO_ACTION_${platform.toUpperCase()}`;
}

function getComposioAction(platform: string): string | null {
  return process.env[actionEnvKey(platform)] ?? DEFAULT_ACTIONS[platform] ?? null;
}

function getConnectedAccountId(platform: string): string | null {
  return process.env[envKey(platform)] ?? null;
}

function telegramApi(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

// ---------------------------------------------------------------------------
// Composio (external channels)
// ---------------------------------------------------------------------------

/** Build the platform-specific input payload from the campaign. */
function buildExternalInput(platform: string, campaign: Doc<"marketingCampaigns">): Record<string, unknown> {
  const caption = campaign.captions[platform] || campaign.captions["x"] || "";
  const media = [campaign.imageUrl, campaign.videoUrl].filter(
    (u): u is string => typeof u === "string" && u.length > 0,
  );
  switch (platform) {
    case "x":
      return { text: caption, media };
    case "linkedin":
      return { text: caption, mediaUrls: media };
    case "instagram":
      return { caption, imageUrl: campaign.imageUrl, media };
    case "tiktok":
      return { caption, videoUrl: campaign.videoUrl, media };
    default:
      return { text: caption, media };
  }
}

/** Execute one Composio action. Returns the parsed response body. */
async function executeComposioAction(
  platform: string,
  campaign: Doc<"marketingCampaigns">,
  input: Record<string, unknown>,
): Promise<unknown> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
  const actionSlug = getComposioAction(platform);
  if (!actionSlug) {
    throw new Error(`No Composio action configured for "${platform}" (set ${actionEnvKey(platform)})`);
  }
  const connectedAccountId = getConnectedAccountId(platform);
  if (!connectedAccountId) {
    throw new Error(`No connected account for "${platform}" (set ${envKey(platform)})`);
  }
  const res = await fetch(`${COMPOSIO_BASE}/actions/${encodeURIComponent(actionSlug)}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ connectedAccountId, input }),
  });
  if (!res.ok) {
    throw new Error(`Composio ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Telegram Bot API (internal broadcast)
// ---------------------------------------------------------------------------

/** Send the campaign to ONE user (photo + caption, or plain message). */
async function sendToUser(
  token: string,
  tgId: string,
  campaign: Doc<"marketingCampaigns">,
): Promise<boolean> {
  const baseCaption =
    campaign.captions["x"] ??
    campaign.captions["linkedin"] ??
    campaign.captions["instagram"] ??
    campaign.captions["tiktok"] ??
    "";
  const appLink = process.env.APP_URL ?? "https://fitness-ai-mini-app.vercel.app";
  const caption =
    baseCaption.length > TELEGRAM_CAPTION_LIMIT
      ? `${baseCaption.slice(0, TELEGRAM_CAPTION_LIMIT)}…`
      : baseCaption;
  const text = caption ? `${caption}\n\n👉 ${appLink}` : `🔥 New drop from FitAI 👉 ${appLink}`;

  if (campaign.imageUrl) {
    const res = await fetch(telegramApi(token, "sendPhoto"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tgId, photo: campaign.imageUrl, caption: text }),
    });
    if (!res.ok) {
      throw new Error(`sendPhoto ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    }
  } else {
    const res = await fetch(telegramApi(token, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tgId, text }),
    });
    if (!res.ok) {
      throw new Error(`sendMessage ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Public action — the scheduled 10:00 entrypoint
// ---------------------------------------------------------------------------

export const runDistribution = action({
  args: { campaignId: v.optional(v.id("marketingCampaigns")) },
  handler: async (ctx, args): Promise<DistributionResult> => {
    if (process.env.MARKETING_ENABLED !== "true") {
      return { ok: false, reason: "MARKETING_DISABLED" };
    }

    const campaign = args.campaignId
      ? await ctx.runQuery(internal.marketing.internals.getCampaign, { campaignId: args.campaignId })
      : await ctx.runQuery(internal.marketing.internals.getLatestReadyCampaign, {});
    if (!campaign) return { ok: false, reason: "NO_READY_CAMPAIGN" };
    if (campaign.status === "distributing") return { ok: false, reason: "ALREADY_DISTRIBUTING" };
    if (campaign.status === "completed") {
      return {
        ok: true,
        campaignId: campaign._id,
        results: {},
        telegram: { status: "sent", total: 0, sent: 0, failed: 0 },
      };
    }

    const campaignId = campaign._id;
    const log = (level: LogLevel, source: string, message: string) =>
      ctx.runMutation(internal.marketing.internals.log, { campaignId, level, source, message });

    await ctx.runMutation(internal.marketing.internals.markDistributing, { campaignId });
    await log("info", "distributor", `Distribution started for "${campaign.theme}"`);
    const results: Record<string, ChannelOutcome> = {};

    // ---- 1) External platforms via Composio (isolated per platform) ---------
    if (!process.env.COMPOSIO_API_KEY) {
      await log("warn", "distributor.composio", "COMPOSIO_API_KEY not set — external platforms skipped");
      for (const platform of campaign.platforms) {
        results[platform] = { status: "skipped", error: "COMPOSIO_API_KEY not set" };
      }
    } else {
      for (const platform of campaign.platforms) {
        try {
          await executeComposioAction(platform, campaign, buildExternalInput(platform, campaign));
          results[platform] = { status: "sent" };
        } catch (e) {
          // X fallback: when media upload is rejected, retry text-only.
          if (platform === "x" && (campaign.imageUrl || campaign.videoUrl)) {
            try {
              await executeComposioAction(platform, campaign, { text: campaign.captions["x"] || "" });
              results[platform] = { status: "sent" };
              await log("warn", "distributor.x", "Media tweet failed — posted text-only fallback");
            } catch (e2) {
              results[platform] = { status: "failed", error: errMsg(e2) };
            }
          } else {
            results[platform] = { status: "failed", error: errMsg(e) };
          }
        }
        if (results[platform].status === "failed") {
          await log("error", `distributor.${platform}`, results[platform].error ?? "failed");
        }
        await ctx.runMutation(internal.marketing.internals.upsertDistribution, {
          campaignId,
          platform,
          status: results[platform].status,
          error: results[platform].error,
          sentAt: results[platform].status === "sent" ? Date.now() : undefined,
        });
      }
    }

    // ---- 2) Internal broadcast to all users (Telegram, 25 users/sec) --------
    let telegram: TelegramStats;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      await log("warn", "distributor.telegram", "TELEGRAM_BOT_TOKEN not set — user broadcast skipped");
      telegram = { status: "skipped", error: "TELEGRAM_BOT_TOKEN not set", total: 0, sent: 0, failed: 0 };
    } else {
      const users = await ctx.runQuery(internal.marketing.internals.listAllUsers, {});
      let sent = 0;
      let failed = 0;
      for (let i = 0; i < users.length; i += TELEGRAM_BATCH_SIZE) {
        const batch = users.slice(i, i + TELEGRAM_BATCH_SIZE);
        const outcomes = await Promise.allSettled(
          batch.map((u) => sendToUser(botToken, u.tgId, campaign)),
        );
        for (const outcome of outcomes) {
          if (outcome.status === "fulfilled") sent++;
          else failed++;
        }
        await ctx.runMutation(internal.marketing.internals.setDistributionProgress, {
          campaignId,
          totalUsers: users.length,
          sentUsers: sent,
          failedUsers: failed,
        });
        // Rate-limit safety: 25 users per second (Telegram global cap ~30/s).
        if (i + TELEGRAM_BATCH_SIZE < users.length) await sleep(TELEGRAM_BATCH_INTERVAL_MS);
      }
      telegram = { status: sent > 0 ? "sent" : "failed", total: users.length, sent, failed };
      await log(
        "info",
        "distributor.telegram",
        `Broadcast finished: ${sent}/${users.length} sent, ${failed} failed`,
      );
    }
    results["telegram"] = { status: telegram.status, error: telegram.error };
    await ctx.runMutation(internal.marketing.internals.upsertDistribution, {
      campaignId,
      platform: "telegram",
      status: telegram.status,
      error: telegram.error,
      sentAt: telegram.status === "sent" ? Date.now() : undefined,
    });

    // ---- 3) Finalize (starts the 24h cleanup clock) -------------------------
    const anySent = Object.values(results).some((r) => r.status === "sent");
    await ctx.runMutation(internal.marketing.internals.finishCampaign, {
      campaignId,
      state: anySent ? "done" : "failed",
      totalUsers: telegram.total,
      sentUsers: telegram.sent,
      failedUsers: telegram.failed,
    });
    await log(
      anySent ? "info" : "error",
      "distributor",
      anySent ? "Distribution completed" : "Distribution failed — no channel succeeded",
    );
    if (anySent) {
      return { ok: true, campaignId, results, telegram };
    }
    return { ok: false, reason: "ALL_CHANNELS_FAILED" };
  },
});
