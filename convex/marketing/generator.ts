// convex/marketing/generator.ts
//
// Multi-modal campaign generation through the Hugging Face Inference API:
//   1. Text  — meta-llama/Llama-3-8B-Instruct              → platform captions
//   2. Image — black-forest-labs/FLUX.1-schnell             → branded fitness visual
//   3. Video — stabilityai/stable-video-diffusion-img2vid-xt → animates the image
//
// Every asset is saved to Convex File Storage and its storageId + public URL
// are recorded in the database (marketingAssets). Steps are isolated: when one
// step fails it is written to marketing_logs and the pipeline keeps going, so
// a text failure never blocks the image, and vice versa.
//
// All database writes go through convex/marketing/internals.ts (internal
// mutations) because actions cannot touch the database directly — and to keep
// this module free of self-referential `internal.*` imports.

import { v } from "convex/values";
import { action, ActionCtx, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { arrayBufferToDataUrl } from "../lib/models";
import { chatCompletion, routeModel } from "../lib/models";

// HF retired the legacy api-inference.huggingface.co serverless API (late 2025).
// All HF inference now goes through the router (https://router.huggingface.co):
//  - text  -> OpenAI-compatible /v1/chat/completions (auto provider routing)
//  - image -> /hf-inference/models/{id} (HF Inference provider catalog)
//  - video -> not served by the HF Inference provider (needs a third-party
//             provider key, e.g. fal-ai/replicate/wavespeed, added in HF
//             settings) — the engine logs the failure and continues without it.
const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const FAL_BASE = "https://queue.fal.run";
const DEFAULT_TEXT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const DEFAULT_IMAGE_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";
const DEFAULT_VIDEO_MODEL = "Lightricks/LTX-Video-0.9.7-distilled";
const DEFAULT_FAL_VIDEO_ENDPOINT = "fal-ai/bytedance/seedance/v1/pro/image-to-video";
const DEFAULT_BRAND_COLOR = "#d7f26d"; // FitAI chartreuse
const KNOWN_PLATFORMS = ["x", "facebook", "instagram", "linkedin"] as const;

/** The app link appended to every caption (overridable via APP_URL). */
function appLink(): string {
  return process.env.APP_URL ?? "https://t.me/FitAI_Training_bot";
}

/**
 * Guarantee the app link is present in a caption. X counts URLs against its
 * character budget, so the body is trimmed there instead of overflowing.
 */
function ensureAppLink(platform: string, caption: string): string {
  const link = appLink();
  if (caption.includes(link)) return caption;
  if (platform === "x") {
    const suffix = `\n\n👉 ${link}`;
    const maxBody = Math.max(0, 270 - suffix.length);
    return caption.slice(0, maxBody) + suffix;
  }
  return `${caption}\n\n👉 ${link}`;
}

function finishCaption(platform: string, result: CaptionResult): CaptionResult {
  return { caption: ensureAppLink(platform, result.caption), hashtags: result.hashtags };
}

type LogLevel = "info" | "warn" | "error";
type CaptionResult = { caption: string; hashtags: string[] };
type Media = { bytes: ArrayBuffer; mime: string };

type GenerateResult =
  | { ok: true; campaignId: Id<"marketingCampaigns">; captions: Record<string, string>; errors: string[] }
  | { ok: false; reason: "MARKETING_DISABLED" }
  | { ok: false; campaignId: Id<"marketingCampaigns">; reason: "GENERATION_FAILED"; errors: string[] };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function hfToken(): string {
  const token = process.env.HF_API_TOKEN ?? process.env.HF_TOKEN;
  if (!token) {
    throw new Error("HF_API_TOKEN is not set. Run `npx convex env set HF_API_TOKEN <token>`.");
  }
  return token;
}

/**
 * POST JSON to the HF Router with cold-start / rate-limit resilience:
 * `x-wait-for-model: true` makes HF hold the request while the model loads,
 * and 429/503/5xx responses (plus timeouts and network hiccups) are retried
 * with exponential backoff.
 */
async function hfRequest(
  url: string,
  body: unknown,
  options: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const maxRetries = options.maxRetries ?? 4;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(Math.min(1000 * 2 ** (attempt - 1), 15_000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken()}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.ok) return res;
      const snippet = (await res.text().catch(() => "")).slice(0, 300);
      if (res.status === 429 || res.status === 503 || res.status >= 500) {
        lastError = new Error(`HF ${res.status} (will retry): ${snippet}`);
        continue;
      }
      throw new Error(`HF ${res.status}: ${snippet}`);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        lastError = new Error(`HF request timed out after ${timeoutMs}ms`);
        continue;
      }
      if (e instanceof TypeError) {
        // fetch-level failure (network): transient, worth retrying
        lastError = e;
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error("HF request failed");
}

/** HF media endpoints return raw bytes OR JSON with a base64 field. Handle both. */
async function responseToBytes(res: Response): Promise<Media> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    const data = (await res.json()) as unknown;
    const b64 =
      (data as { video?: unknown })?.video ??
      (data as { image?: unknown })?.image ??
      (data as { data?: unknown })?.data ??
      (data as { base64?: unknown })?.base64 ??
      (Array.isArray(data) ? (data[0] as { generated_video?: unknown })?.generated_video ?? null : null);
    if (typeof b64 !== "string" || b64.length === 0) {
      throw new Error("HF returned JSON without a base64 media field");
    }
    const prefix = b64.startsWith("data:") ? b64.split(";")[0] : "";
    const mime = prefix.split(":")[1] ?? "application/octet-stream";
    const bytes = base64ToBytes(b64);
    return { bytes: bytes.buffer as ArrayBuffer, mime };
  }
  return { bytes: await res.arrayBuffer(), mime: contentType.split(";")[0] || "application/octet-stream" };
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  if (typeof atob === "function") {
    const binary = atob(cleaned);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  // Manual fallback decoder for runtimes without atob.
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const padded = cleaned.replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((padded.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const ch of padded) {
    const val = ALPHABET.indexOf(ch);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
    }
  }
  return out;
}

function normalizePlatforms(raw: string[] | undefined): string[] {
  const known: readonly string[] = KNOWN_PLATFORMS;
  if (!raw || raw.length === 0) return [...known];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    if (known.includes(p) && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prompts (the canonical copies live in convex/marketing/PROMPTS.md)
// ---------------------------------------------------------------------------

const TEXT_SYSTEM_PROMPT = [
  "You are a senior social media copywriter for FitAI, a free fitness mini app on Telegram.",
  "Brand voice: energetic, bold, zero fluff, motivating but never preachy.",
  "You write platform-native copy, not generic text.",
  "Do not think out loud and do not include reasoning — output the JSON immediately.",
  "Reply with strict JSON only: {\"caption\":\"...\",\"hashtags\":[\"...\"]}.",
].join(" ");

const PLATFORM_TEXT_INSTRUCTIONS: Record<string, string> = {
  x: "Platform: X (Twitter). Write one viral post, maximum 250 characters. Start with a scroll-stopping hook. 2-3 hashtags only.",
  facebook:
    "Platform: Facebook. Write one engaging post of 100-150 words with a conversational tone. End with one clear question that sparks comments and one soft call-to-action. 3-5 hashtags.",
  linkedin:
    "Platform: LinkedIn. Write one professional post of 800-1100 characters. Story-driven opening line, then three short value bullets, one soft call-to-action. 3 hashtags.",
  instagram:
    "Platform: Instagram. Write one energetic caption of 130-180 words with line breaks and 2-4 emojis. Call to action: open FitAI on Telegram. 8-10 hashtags, fitness niche.",
  tiktok:
    "Platform: TikTok. Write one short punchy caption under 140 characters, hook first. 4-6 hashtags including one trending fitness tag.",
};

function textUserPrompt(platform: string, theme: string, topic: string, brandColor: string): string {
  return [
    PLATFORM_TEXT_INSTRUCTIONS[platform],
    `Campaign theme: ${theme}.`,
    `Focus topic: ${topic}.`,
    `Brand accent color: ${brandColor} (mention it only if it fits naturally).`,
    "Mention lightly that FitAI is a free Telegram mini app.",
    "Always end the caption with the app link: https://t.me/FitAI_Training_bot. Keep within the platform length limit.",
    'Reply with ONLY a JSON object: {"caption":"...","hashtags":["..."]}. No markdown fences.',
  ].join("\n");
}

function imagePrompt(theme: string, topic: string, brandColor: string): string {
  return [
    "Cinematic fitness photograph,",
    theme,
    `featuring ${topic},`,
    `dominant accent color ${brandColor} on training apparel, gym equipment and rim lighting,`,
    "moody dark background, dramatic rim light, shallow depth of field, 35mm lens,",
    "ultra high resolution, professional sports advertising aesthetic,",
    "no text, no watermark, no logo",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Generation steps
// ---------------------------------------------------------------------------

/**
 * 1) Text: one caption per platform via the HF Router's OpenAI-compatible chat
 * completions (auto provider routing); on any HF failure the step falls back
 * to the app's DeepSeek model so caption generation keeps working.
 */
async function generateCaption(
  platform: string,
  theme: string,
  topic: string,
  brandColor: string,
): Promise<CaptionResult> {
  const model = process.env.MARKETING_TEXT_MODEL ?? DEFAULT_TEXT_MODEL;
  const userPrompt = textUserPrompt(platform, theme, topic, brandColor);

  // --- Attempt 1: Hugging Face router (auto provider selection) ---
  try {
    const res = await hfRequest(
      HF_CHAT_URL,
      {
        model,
        messages: [
          { role: "system", content: TEXT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 700,
        temperature: 0.85,
      },
      { timeoutMs: 60_000, maxRetries: 2 },
    );
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("HF chat returned empty content");
    return finishCaption(platform, parseCaption(content));
  } catch (e) {
    // --- Attempt 2: DeepSeek fallback (same prompts, OpenAI-compatible API) ---
    if (process.env.MARKETING_TEXT_FALLBACK === "off") throw e;
    const fallback = routeModel({ vision: false });
    if (!fallback) throw e;
    // The DeepSeek text model is a reasoning model: give it a generous token
    // budget so reasoning never starves the caption content.
    const cfg = { ...fallback, maxTokens: 4000, temperature: 0.7 };
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await chatCompletion(cfg, [
          { role: "system", content: TEXT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ]);
        return finishCaption(platform, parseCaption(text));
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("DeepSeek fallback failed");
  }
}

/** Parse the model's reply: prefer JSON, fall back to regex extraction, then raw text. */
function parseCaption(raw: string): CaptionResult {
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
        caption?: unknown;
        hashtags?: unknown;
      };
      const caption = typeof parsed.caption === "string" ? parsed.caption.trim() : "";
      const hashtags = Array.isArray(parsed.hashtags)
        ? parsed.hashtags
            .filter((h): h is string => typeof h === "string")
            .map((h) => h.replace(/^#/, "").trim())
        : [];
      if (caption) return { caption, hashtags };
    } catch {
      // Invalid JSON (e.g. literal newlines inside strings) — extract fields directly.
      const captionMatch = cleaned.match(/"caption"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (captionMatch) {
        let caption = "";
        try {
          caption = (JSON.parse(`"${captionMatch[1]}"`) as string).trim();
        } catch {
          caption = captionMatch[1].trim();
        }
        const hashtags = [...cleaned.matchAll(/"hashtags"\s*:\s*\[([\s\S]*?)\]/g)]
          .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((t) => t[1].replace(/^#/, "").trim()))
          .filter(Boolean);
        if (caption) return { caption, hashtags };
      }
      // Truncated JSON: the model hit its token budget mid-string
      // ({"caption":"Partial text… without a closing quote). Recover the text.
      const truncated = cleaned.match(/^\s*\{\s*"caption"\s*:\s*"([\s\S]*)$/);
      if (truncated) {
        const partial = truncated[1].replace(/[",}\s]+$/, "").trim();
        if (partial) return { caption: partial, hashtags: [] };
      }
    }
  }
  const hashtags = [...cleaned.matchAll(/#[\p{L}\p{N}_]+/gu)].map((m) => m[0].replace(/^#/, ""));
  return { caption: cleaned, hashtags };
}

/** 2) Image: HF Inference provider text-to-image (SD3-medium, free credits). */
async function generateImage(theme: string, topic: string, brandColor: string): Promise<Media> {
  const model = process.env.MARKETING_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;
  const res = await hfRequest(
    `${HF_BASE}/${model}`,
    {
      inputs: imagePrompt(theme, topic, brandColor),
      parameters: { width: 1024, height: 1024 },
    },
    { timeoutMs: 180_000, maxRetries: 3 },
  );
  return await responseToBytes(res);
}

/**
 * 3) Video: animates the freshly generated image. Two attempts:
 *    a. HF router image-to-video model (provider-dependent), then
 *    b. fal-ai fallback — Seedance (ByteDance) image-to-video via the fal
 *       queue API (FAL_API_KEY required; free credits on signup).
 * The model takes the image itself as input (base64 data URL for HF, public
 * storage URL for fal — external services can never read Convex storage ids).
 */
function videoMotionPrompt(theme: string, topic: string): string {
  return [
    "Slow cinematic camera push-in on the athlete, subtle dynamic movement,",
    "dramatic rim light, professional fitness advertisement style,",
    theme,
    topic,
    "no text, no watermark",
  ].join(" ");
}

async function falGenerateVideo(imageUrl: string, theme: string, topic: string): Promise<Media> {
  const key = process.env.FAL_API_KEY;
  if (!key) {
    throw new Error("FAL_API_KEY is not set (create a free key at https://fal.ai to enable the Seedance video fallback)");
  }
  const endpoint = process.env.FAL_VIDEO_ENDPOINT ?? DEFAULT_FAL_VIDEO_ENDPOINT;
  const duration = process.env.FAL_VIDEO_DURATION ?? "5s";

  const submit = await fetch(`${FAL_BASE}/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: videoMotionPrompt(theme, topic),
      image_url: imageUrl,
      duration,
    }),
  });
  if (!submit.ok) {
    throw new Error(`fal submit ${submit.status}: ${(await submit.text().catch(() => "")).slice(0, 300)}`);
  }
  const submitted = (await submit.json()) as { request_id?: string; requestId?: string };
  const requestId = submitted.request_id ?? submitted.requestId;
  if (!requestId) throw new Error("fal submit returned no request id");

  const deadline = Date.now() + 6 * 60 * 1000; // 6-minute budget
  for (;;) {
    const statusRes = await fetch(`${FAL_BASE}/${endpoint}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${key}` },
    });
    if (!statusRes.ok) throw new Error(`fal status ${statusRes.status}`);
    const st = (await statusRes.json()) as {
      status?: string;
      data?: { video?: { url?: string }; error?: unknown };
    };
    if (st.status === "COMPLETED") {
      const videoUrl = st.data?.video?.url;
      if (!videoUrl) throw new Error("fal completed without a video url");
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) throw new Error(`fal video download ${videoRes.status}`);
      return { bytes: await videoRes.arrayBuffer(), mime: "video/mp4" };
    }
    if (st.status === "FAILED") {
      throw new Error(`fal video failed: ${String(st.data?.error ?? "unknown error")}`);
    }
    if (Date.now() > deadline) throw new Error("fal video generation timed out");
    await sleep(5000);
  }
}

async function generateVideo(
  image: Media,
  imageUrl: string | undefined,
  theme: string,
  topic: string,
): Promise<Media> {
  const model = process.env.MARKETING_VIDEO_MODEL ?? DEFAULT_VIDEO_MODEL;
  const dataUrl = arrayBufferToDataUrl(image.mime, image.bytes);
  const bodies = [{ inputs: dataUrl }, { inputs: { image: dataUrl } }];
  let hfError: unknown = null;
  for (const body of bodies) {
    try {
      const res = await hfRequest(`${HF_BASE}/${model}`, body, { timeoutMs: 300_000, maxRetries: 2 });
      return await responseToBytes(res);
    } catch (e) {
      hfError = e;
    }
  }
  // fal-ai Seedance fallback (uses the public image URL).
  if (imageUrl) {
    try {
      return await falGenerateVideo(imageUrl, theme, topic);
    } catch (e) {
      throw new Error(
        `HF video failed: ${errMsg(hfError)}; fal-ai fallback failed: ${errMsg(e)}`,
      );
    }
  }
  throw hfError instanceof Error ? hfError : new Error("Video generation failed");
}

/** Store bytes in Convex File Storage and record the asset row. */
async function storeAsset(
  ctx: ActionCtx,
  campaignId: Id<"marketingCampaigns">,
  kind: "image" | "video",
  bytes: ArrayBuffer,
  mime: string,
): Promise<{ storageId: string; url: string | undefined }> {
  const storageId = await ctx.storage.store(new Blob([bytes], { type: mime }));
  const url = (await ctx.storage.getUrl(storageId)) ?? undefined;
  await ctx.runMutation(internal.marketing.internals.saveAsset, { campaignId, kind, storageId, url });
  return { storageId, url };
}

// ---------------------------------------------------------------------------
// Public action — the scheduled 18:00 Riyadh (15:00 UTC) entrypoint
// ---------------------------------------------------------------------------

/** Health check: probes the HF hosts reachable from the Convex runtime. */
export const pingHf = action({
  args: {},
  handler: async () => {
    const probe = async (label: string, url: string, init: RequestInit) => {
      try {
        const res = await fetch(url, init);
        const ct = res.headers.get("content-type") ?? "";
        const body = (await res.text().catch(() => "")).slice(0, 200);
        return { label, ok: res.ok, status: res.status, contentType: ct, body };
      } catch (e) {
        return {
          label,
          ok: false,
          error: String(e),
          errorName: e instanceof Error ? e.name : null,
          errorCtor: e instanceof Error ? e.constructor?.name : typeof e,
        };
      }
    };
    const token = process.env.HF_API_TOKEN ?? process.env.HF_TOKEN ?? "";
    const auth = { Authorization: `Bearer ${token}` };
    const results = await Promise.all([
      probe("whoami", "https://huggingface.co/api/whoami-v2", { method: "GET", headers: auth }),
      probe(
        "router-textgen",
        "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3-8B-Instruct",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({
            inputs: "Reply with exactly one word: hello",
            parameters: { max_new_tokens: 4, return_full_text: false },
          }),
        },
      ),
      probe(
        "router-chat-completions",
        "https://router.huggingface.co/hf-inference/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({
            model: "meta-llama/Llama-3-8B-Instruct",
            messages: [{ role: "user", content: "Reply with exactly one word: hello" }],
            max_tokens: 4,
          }),
        },
      ),
    ]);
    return { results };
  },
});

// ---------------------------------------------------------------------------
// Public queries (dashboard/CLI inspection)
// ---------------------------------------------------------------------------

/** Latest campaigns, newest first (status, media URLs, captions, errors). */
export const listCampaigns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const take = Math.min(args.limit ?? 10, 50);
    return await ctx.db.query("marketingCampaigns").order("desc").take(take);
  },
});

/** One campaign by id (full document). */
export const getCampaign = query({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db.get(campaignId);
  },
});

export const generateCampaign = action({
  args: {
    theme: v.optional(v.string()),
    topic: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<GenerateResult> => {
    // Master switch: the engine stays dormant until MARKETING_ENABLED === "true".
    if (process.env.MARKETING_ENABLED !== "true") {
      return { ok: false, reason: "MARKETING_DISABLED" };
    }

    const theme = args.theme ?? process.env.MARKETING_THEME ?? "30-day fitness transformation";
    const topic = args.topic ?? process.env.MARKETING_TOPIC ?? "quick home workouts, no equipment";
    const brandColor = args.brandColor ?? process.env.MARKETING_BRAND_COLOR ?? DEFAULT_BRAND_COLOR;
    const platforms = normalizePlatforms(args.platforms);

    const campaignId = await ctx.runMutation(internal.marketing.internals.createCampaign, {
      theme,
      topic,
      brandColor,
      platforms,
    });
    const log = (level: LogLevel, source: string, message: string) =>
      ctx.runMutation(internal.marketing.internals.log, { campaignId, level, source, message });

    await log("info", "generator", `Campaign started: theme="${theme}" platforms=${platforms.join(",")}`);
    const errors: string[] = [];

    // --- Step 1: captions ---------------------------------------------------
    const captions: Record<string, string> = {};
    const hashtags: string[] = [];
    let hfAvailable = true;
    try {
      hfToken();
    } catch (e) {
      hfAvailable = false;
      errors.push(errMsg(e));
      await log("error", "generator.text", errMsg(e));
    }
    if (hfAvailable) {
      for (const platform of platforms) {
        try {
          const { caption, hashtags: tags } = await generateCaption(platform, theme, topic, brandColor);
          captions[platform] = caption;
          for (const tag of tags) {
            if (!hashtags.includes(tag)) hashtags.push(tag);
          }
          await log("info", `generator.text.${platform}`, `Caption ready (${caption.length} chars)`);
        } catch (e) {
          errors.push(`text/${platform}: ${errMsg(e)}`);
          await log("error", `generator.text.${platform}`, errMsg(e));
        }
      }
    }
    await ctx.runMutation(internal.marketing.internals.updateCampaign, {
      campaignId,
      captions,
      hashtags,
    });

    // --- Step 2: image -> Step 3: video (chained: video animates the image) --
    let image: Media | null = null;
    let imageUrl: string | undefined;
    if (hfAvailable) {
      try {
        image = await generateImage(theme, topic, brandColor);
        const saved = await storeAsset(ctx, campaignId, "image", image.bytes, image.mime);
        imageUrl = saved.url;
        await ctx.runMutation(internal.marketing.internals.updateCampaign, {
          campaignId,
          imageStorageId: saved.storageId,
          imageUrl: saved.url,
        });
        await log("info", "generator.image", `Image stored: ${saved.storageId}`);
      } catch (e) {
        errors.push(`image: ${errMsg(e)}`);
        await log("error", "generator.image", errMsg(e));
      }

      if (image) {
        try {
          const video = await generateVideo(image, imageUrl, theme, topic);
          const saved = await storeAsset(ctx, campaignId, "video", video.bytes, video.mime);
          await ctx.runMutation(internal.marketing.internals.updateCampaign, {
            campaignId,
            videoStorageId: saved.storageId,
            videoUrl: saved.url,
          });
          await log("info", "generator.video", `Video stored: ${saved.storageId}`);
        } catch (e) {
          errors.push(`video: ${errMsg(e)}`);
          await log("error", "generator.video", errMsg(e));
        }
      }
    }

    // --- Finalize -----------------------------------------------------------
    const hasContent = Object.values(captions).some((c) => c.length > 0) || image !== null;
    if (hasContent) {
      await ctx.runMutation(internal.marketing.internals.updateCampaign, {
        campaignId,
        status: "ready",
        generatedAt: Date.now(),
      });
      await log("info", "generator", "Campaign ready for distribution");
      return { ok: true, campaignId, captions, errors };
    }
    await ctx.runMutation(internal.marketing.internals.updateCampaign, {
      campaignId,
      status: "failed",
      error: errors.join("; ") || "No content generated",
    });
    await log("error", "generator", "Campaign failed: no captions and no image");
    return { ok: false, campaignId, reason: "GENERATION_FAILED", errors };
  },
});
