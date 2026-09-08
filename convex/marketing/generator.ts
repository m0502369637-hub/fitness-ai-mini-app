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
// All HF inference now goes through the router (https://router.huggingface.co)
// with provider-pinned or auto-routed models. The default ids below are the
// current Inference-Provider-era catalog; the original spec models
// (meta-llama/Llama-3-8B-Instruct, FLUX.1-schnell, SVD-img2vid-xt) are retired
// upstream and remain overridable via env.
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const DEFAULT_TEXT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const DEFAULT_IMAGE_MODEL = "Qwen/Qwen-Image";
const DEFAULT_VIDEO_MODEL = "Lightricks/LTX-Video-0.9.7-distilled";
const DEFAULT_BRAND_COLOR = "#d7f26d"; // FitAI chartreuse
const KNOWN_PLATFORMS = ["x", "facebook", "instagram", "linkedin"] as const;

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
 * POST to the HF Router (provider-aware inference) with cold-start / rate-limit
 * resilience: `x-wait-for-model: true` makes HF hold the request while the model
 * loads, and 429/503/5xx responses (plus timeouts and network hiccups) are
 * retried with exponential backoff.
 */
async function hfRequest(
  model: string,
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
      const res = await fetch(`${HF_BASE}/${model}`, {
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
 * 1) Text: one caption per platform via the HF Router; on any HF failure
 * (missing permission, provider catalog gap, network) the step falls back to
 * the app's DeepSeek model so caption generation keeps working.
 */
async function generateCaption(
  platform: string,
  theme: string,
  topic: string,
  brandColor: string,
): Promise<CaptionResult> {
  const model = process.env.MARKETING_TEXT_MODEL ?? DEFAULT_TEXT_MODEL;
  const userPrompt = textUserPrompt(platform, theme, topic, brandColor);

  // --- Attempt 1: Hugging Face (Llama-3 chat template on the router) ---
  try {
    const inputs = [
      "<|begin_of_text|><|start_header_id|>system<|end_header_id|>",
      "",
      TEXT_SYSTEM_PROMPT,
      "<|eot_id|><|start_header_id|>user<|end_header_id|>",
      "",
      userPrompt,
      "<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
      "",
    ].join("\n");
    const res = await hfRequest(
      model,
      {
        inputs,
        parameters: { max_new_tokens: 220, temperature: 0.85, do_sample: true, return_full_text: false },
      },
      { timeoutMs: 60_000, maxRetries: 2 },
    );
    const json = (await res.json()) as unknown;
    let raw = "";
    if (Array.isArray(json)) {
      const first = json[0] as { generated_text?: string } | undefined;
      raw = first?.generated_text ?? "";
    } else if (json && typeof json === "object") {
      const obj = json as { error?: unknown; generated_text?: unknown };
      if (typeof obj.error === "string" && obj.error.length > 0) {
        throw new Error(`HF text model: ${obj.error}`);
      }
      raw = typeof obj.generated_text === "string" ? obj.generated_text : "";
    }
    if (!raw.trim()) throw new Error("HF text model returned empty output");
    return parseCaption(raw);
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
        return parseCaption(text);
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

/** 2) Image: current-generation HF provider text-to-image model. */
async function generateImage(theme: string, topic: string, brandColor: string): Promise<Media> {
  const model = process.env.MARKETING_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;
  const res = await hfRequest(
    model,
    { inputs: imagePrompt(theme, topic, brandColor) },
    { timeoutMs: 180_000, maxRetries: 3 },
  );
  return await responseToBytes(res);
}

/**
 * 3) Video: animates the freshly generated image with a current-generation
 * image-to-video model. The model takes the image itself as input (base64 data
 * URL — HF cannot download from Convex storage ids, so we never pass a
 * storageId here). Both accepted body shapes are attempted before giving up.
 */
async function generateVideo(image: Media): Promise<Media> {
  const model = process.env.MARKETING_VIDEO_MODEL ?? DEFAULT_VIDEO_MODEL;
  const dataUrl = arrayBufferToDataUrl(image.mime, image.bytes);
  const bodies = [{ inputs: dataUrl }, { inputs: { image: dataUrl } }];
  let lastError: unknown = null;
  for (const body of bodies) {
    try {
      const res = await hfRequest(model, body, { timeoutMs: 300_000, maxRetries: 2 });
      return await responseToBytes(res);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Video generation failed");
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
    if (hfAvailable) {
      try {
        image = await generateImage(theme, topic, brandColor);
        const saved = await storeAsset(ctx, campaignId, "image", image.bytes, image.mime);
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
          const video = await generateVideo(image);
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
