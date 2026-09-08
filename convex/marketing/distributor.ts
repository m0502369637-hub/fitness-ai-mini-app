// convex/marketing/distributor.ts
//
// Global distribution for a "ready" campaign:
//
//   External — each platform is posted through Composio's v3 tool-execution API
//              (POST /api/v3.1/tools/execute/{tool_slug}). Real, current tool
//              flows per platform:
//                X          TWITTER_UPLOAD_MEDIA -> TWITTER_CREATION_OF_A_POST
//                           (text-only retry if media upload fails)
//                Facebook   FACEBOOK_CREATE_PHOTO_POST (page_id + photo url)
//                Instagram  INSTAGRAM_POST_IG_USER_MEDIA -> ..._PUBLISH
//                LinkedIn   LINKEDIN_CREATE_LINKED_IN_POST (author + commentary)
//              Every platform is isolated: one failure never blocks the others.
//   Internal — broadcast to every app user via the Telegram Bot API in batches
//              of 25 users/second (Telegram's global limit is ~30 msg/sec).
//
// Media is always passed to external APIs as the PUBLIC URL from
// storage.getUrl() — external services cannot read internal storage ids.
//
// All database writes go through convex/marketing/internals.ts.

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { bytesToBase64 } from "../lib/models";

const COMPOSIO_BASE = "https://backend.composio.dev";
const COMPOSIO_EXECUTE_PATH = "/api/v3.1/tools/execute/";
const TELEGRAM_BATCH_SIZE = 25; // users per batch
const TELEGRAM_BATCH_INTERVAL_MS = 1000; // 1s per batch => 25 msg/sec (< 30/s global cap)
const TELEGRAM_CAPTION_LIMIT = 900; // sendPhoto caption hard limit is 1024

// Current Composio v3 tool slugs (verified against the live tool catalog).
const DEFAULT_TOOLS: Record<string, string> = {
  x: "TWITTER_CREATION_OF_A_POST",
  facebook: "FACEBOOK_CREATE_PHOTO_POST",
  linkedin: "LINKEDIN_CREATE_LINKED_IN_POST",
  instagram: "INSTAGRAM_POST_IG_USER_MEDIA",
  tiktok: "TIKTOK_POST_VIDEO",
};
const DEFAULT_EXTRA_TOOLS: Record<string, string> = {
  x_upload: "TWITTER_UPLOAD_MEDIA",
  instagram_publish: "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH",
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

function getToolSlug(platform: string): string | null {
  return process.env[actionEnvKey(platform)] ?? DEFAULT_TOOLS[platform] ?? null;
}

function getExtraToolSlug(extra: string): string | null {
  return process.env[`COMPOSIO_ACTION_${extra.toUpperCase()}`] ?? DEFAULT_EXTRA_TOOLS[extra] ?? null;
}

function getConnectedAccountId(platform: string): string | null {
  return process.env[envKey(platform)] ?? null;
}

function telegramApi(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

function captionFor(campaign: Doc<"marketingCampaigns">, platform: string): string {
  return (
    campaign.captions[platform] ||
    campaign.captions["x"] ||
    campaign.captions["instagram"] ||
    campaign.captions["facebook"] ||
    campaign.captions["linkedin"] ||
    ""
  );
}

// ---------------------------------------------------------------------------
// Composio (external channels)
// ---------------------------------------------------------------------------

/** Execute one Composio v3 tool. Returns the parsed response body. */
async function runComposioTool(
  platform: string,
  toolSlug: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
  const connectedAccountId = getConnectedAccountId(platform);
  if (!connectedAccountId) {
    throw new Error(`No connected account for "${platform}" (set ${envKey(platform)})`);
  }
  const res = await fetch(`${COMPOSIO_BASE}${COMPOSIO_EXECUTE_PATH}${encodeURIComponent(toolSlug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ connected_account_id: connectedAccountId, arguments: input }),
  });
  if (!res.ok) {
    throw new Error(`Composio ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  return await res.json();
}

/** Dig a string field out of a Composio v3 response envelope. */
function extractString(data: unknown, ...keys: string[]): string | undefined {
  const candidates: unknown[] = [];
  const root = data as { data?: unknown; output?: unknown; result?: unknown } | null;
  if (root && typeof root === "object") {
    candidates.push(root.data, root.output, root.result);
  }
  candidates.push(data);
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    if (Array.isArray(c) && c.length > 0) {
      const v = extractString(c[0], ...keys);
      if (v) return v;
    }
    const obj = c as Record<string, unknown>;
    for (const k of keys) {
      const val = obj[k];
      if (typeof val === "string" && val.length > 0) return val;
      if (typeof val === "number") return String(val);
    }
  }
  return undefined;
}

/** X: upload the campaign image, then create the tweet with the media attached. */
async function postToX(campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  const postSlug = getToolSlug("x");
  const uploadSlug = getExtraToolSlug("x_upload");
  if (!postSlug) throw new Error("No Composio tool configured for x");
  const caption = captionFor(campaign, "x");
  if (!campaign.imageUrl || !uploadSlug) {
    return await runComposioTool("x", postSlug, { text: caption });
  }
  const imgRes = await fetch(campaign.imageUrl);
  if (!imgRes.ok) throw new Error(`Could not download campaign image: ${imgRes.status}`);
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  const uploadRes = await runComposioTool("x", uploadSlug, {
    media: { name: "campaign.jpg", content: bytesToBase64(bytes), mime_type: "image/jpeg" },
    media_type: "image/jpeg",
  });
  const mediaId = extractString(uploadRes, "media_id_string", "media_id", "mediaId", "id");
  if (!mediaId) throw new Error("X media upload returned no media id");
  return await runComposioTool("x", postSlug, { text: caption, media_media_ids: [mediaId] });
}

/** Facebook: photo post to a page (page_id from env, photo via public URL). */
async function postToFacebook(campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  const slug = getToolSlug("facebook");
  if (!slug) throw new Error("No Composio tool configured for facebook");
  const pageId = process.env.COMPOSIO_FACEBOOK_PAGE_ID;
  if (!pageId) {
    throw new Error("COMPOSIO_FACEBOOK_PAGE_ID is not set (your Facebook Page id)");
  }
  const input: Record<string, unknown> = { page_id: pageId, message: captionFor(campaign, "facebook") };
  if (campaign.imageUrl) input.url = campaign.imageUrl;
  return await runComposioTool("facebook", slug, input);
}

/** Instagram: create media container, then publish it (two-step Graph flow). */
async function postToInstagram(campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  const containerSlug = getToolSlug("instagram");
  const publishSlug = getExtraToolSlug("instagram_publish");
  if (!containerSlug || !publishSlug) throw new Error("No Composio tools configured for instagram");
  const igUserId = process.env.COMPOSIO_INSTAGRAM_IG_USER_ID;
  if (!igUserId) {
    throw new Error("COMPOSIO_INSTAGRAM_IG_USER_ID is not set (your Instagram professional account id)");
  }
  const containerInput: Record<string, unknown> = {
    ig_user_id: igUserId,
    caption: captionFor(campaign, "instagram"),
  };
  if (campaign.imageUrl) containerInput.image_url = campaign.imageUrl;
  if (campaign.videoUrl) containerInput.video_url = campaign.videoUrl;
  const containerRes = await runComposioTool("instagram", containerSlug, containerInput);
  const creationId = extractString(containerRes, "creation_id", "id");
  if (!creationId) throw new Error("Instagram container returned no creation id");
  return await runComposioTool("instagram", publishSlug, { ig_user_id: igUserId, creation_id: creationId });
}

/** LinkedIn: text post authored by the configured member URN. */
async function postToLinkedin(campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  const slug = getToolSlug("linkedin");
  if (!slug) throw new Error("No Composio tool configured for linkedin");
  const author = process.env.COMPOSIO_LINKEDIN_AUTHOR;
  if (!author) {
    throw new Error("COMPOSIO_LINKEDIN_AUTHOR is not set (e.g. urn:li:person:XXXX)");
  }
  return await runComposioTool("linkedin", slug, {
    author,
    commentary: captionFor(campaign, "linkedin"),
    visibility: "PUBLIC",
  });
}

/** Generic fallback for any other platform: a single tool call with caption. */
async function postGeneric(platform: string, campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  const slug = getToolSlug(platform);
  if (!slug) throw new Error(`No Composio tool configured for "${platform}" (set ${actionEnvKey(platform)})`);
  return await runComposioTool(platform, slug, { text: captionFor(campaign, platform) });
}

async function postToPlatform(platform: string, campaign: Doc<"marketingCampaigns">): Promise<unknown> {
  switch (platform) {
    case "x":
      return await postToX(campaign);
    case "facebook":
      return await postToFacebook(campaign);
    case "instagram":
      return await postToInstagram(campaign);
    case "linkedin":
      return await postToLinkedin(campaign);
    default:
      return await postGeneric(platform, campaign);
  }
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
  const baseCaption = captionFor(campaign, "telegram");
  const appLink = process.env.APP_URL ?? "https://t.me/FitAI_Training_bot";
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
// Public action — the scheduled 19:00 Riyadh (16:00 UTC) entrypoint
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
          await postToPlatform(platform, campaign);
          results[platform] = { status: "sent" };
        } catch (e) {
          // X fallback: when the media tweet fails, retry text-only.
          if (platform === "x" && campaign.imageUrl) {
            try {
              const postSlug = getToolSlug("x");
              if (!postSlug) throw new Error("No Composio tool configured for x");
              await runComposioTool("x", postSlug, { text: captionFor(campaign, "x") });
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
