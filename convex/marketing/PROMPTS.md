# Marketing Engine — Prompts & Operating Manual

This document is the single source of truth for the **Autonomous Marketing OS**
(`convex/marketing/`). It lists every AI prompt the engine sends, the model
configuration, the required environment variables, and the daily schedule.

```
convex/marketing/
├── schema.ts      # tables merged into the app schema (campaigns/assets/logs/distributions)
├── internals.ts   # internal mutations/queries (actions can't touch the DB directly)
├── generator.ts   # HF: text -> image -> video, saves to Convex File Storage
├── distributor.ts # Composio (X/LinkedIn/Instagram/TikTok) + Telegram Bot API broadcast
├── cleaner.ts     # deletes stored files 24h after a campaign completes
├── crons.ts       # 08:00 generate / 10:00 distribute / 23:00 cleanup (UTC)
└── PROMPTS.md     # this file
```

`convex/crons.ts` (repo root) re-exports `marketing/crons.ts` because Convex only
reads the crons config from the root path.

---

## 1. Models

| Stage | Model | Env override |
| --- | --- | --- |
| Text (captions) | `meta-llama/Llama-3-8B-Instruct` | `MARKETING_TEXT_MODEL` |
| Image | `black-forest-labs/FLUX.1-schnell` | `MARKETING_IMAGE_MODEL` |
| Video | `stabilityai/stable-video-diffusion-img2vid-xt` | `MARKETING_VIDEO_MODEL` |

All calls go through the Hugging Face Inference API
(`https://api-inference.huggingface.co/models/<model>`) with the standard
`Authorization: Bearer <HF_API_TOKEN>` header and `x-wait-for-model: true`
(blocks until the model is loaded instead of returning 503). 429/503/5xx,
timeouts and network errors are retried with exponential backoff.

The video stage receives the **generated image itself** as a base64 data URL
(`data:image/jpeg;base64,...`). HF cannot download from Convex storage ids, so
the raw image bytes are passed directly — never a storageId.

---

## 2. Text prompts (Llama-3-8B-Instruct)

The model is called on the raw text-generation endpoint, so the full
Llama 3 chat template is applied around system + user turns.

### System prompt (all platforms)

```text
You are a senior social media copywriter for FitAI, a free fitness mini app on Telegram.
Brand voice: energetic, bold, zero fluff, motivating but never preachy.
You write platform-native copy, not generic text.
Reply with strict JSON only: {"caption":"...","hashtags":["..."]}.
```

### User prompt template

```text
<PLATFORM_INSTRUCTIONS>
Campaign theme: <theme>.
Focus topic: <topic>.
Brand accent color: <brandColor> (mention it only if it fits naturally).
Mention lightly that FitAI is a free Telegram mini app.
Reply with ONLY a JSON object: {"caption":"...","hashtags":["..."]}. No markdown fences.
```

### Platform instructions

```text
X (Twitter):    "Write one viral post, maximum 250 characters. Start with a
                scroll-stopping hook. 2-3 hashtags only."

LinkedIn:       "Write one professional post of 800-1100 characters.
                Story-driven opening line, then three short value bullets, one
                soft call-to-action. 3 hashtags."

Instagram:      "Write one energetic caption of 130-180 words with line breaks
                and 2-4 emojis. Call to action: open FitAI on Telegram.
                8-10 hashtags, fitness niche."

TikTok:         "Write one short punchy caption under 140 characters, hook
                first. 4-6 hashtags including one trending fitness tag."
```

Generation parameters: `max_new_tokens: 220, temperature: 0.85, do_sample: true,
return_full_text: false`.

The reply is parsed as JSON with a graceful fallback: if the model returns
plain text, the whole text becomes the caption and `#hashtags` are extracted
with a regex scan.

---

## 3. Image prompt (FLUX.1-schnell)

```text
Cinematic fitness photograph, <theme> featuring <topic>,
dominant accent color <brandColor> on training apparel, gym equipment and rim lighting,
moody dark background, dramatic rim light, shallow depth of field, 35mm lens,
ultra high resolution, professional sports advertising aesthetic,
no text, no watermark, no logo
```

- `<theme>` — e.g. `30-day fitness transformation`
- `<topic>` — e.g. `quick home workouts, no equipment`
- `<brandColor>` — default `#d7f26d` (FitAI chartreuse), overridable per run
  via `generateCampaign({ brandColor: "#..." })`.

FLUX.1-schnell returns raw image bytes (JPEG/PNG); the engine stores them with
`ctx.storage.store()` and records both the `storageId` and the public
`storage.getUrl()` result.

---

## 4. Video prompt (stable-video-diffusion-img2vid-xt)

SVD is an **image-to-video** model: it has no text prompt. The input is the
image generated in step 3, passed as a base64 data URL.

```text
inputs: "data:image/jpeg;base64,<bytes of the FLUX image>"
```

The engine tries both accepted body shapes (`{inputs: dataUrl}` and
`{inputs: {image: dataUrl}}`) and returns the first that works. The response is
stored as `video/mp4` (or the content-type HF returns) and its URL is what gets
posted to TikTok/video-capable channels.

---

## 5. Distribution

### External (Composio)

`POST https://backend.composio.dev/api/v2/actions/{action}/execute`

```json
{
  "connectedAccountId": "<from env>",
  "input": { "text": "<caption>", "media": ["<imageUrl>", "<videoUrl>"] }
}
```

| Platform | Default action slug | Env override |
| --- | --- | --- |
| X | `TWITTER_CREATE_TWEET` | `COMPOSIO_ACTION_X` |
| LinkedIn | `LINKEDIN_CREATE_LINKED_IN_POST` | `COMPOSIO_ACTION_LINKEDIN` |
| Instagram | `INSTAGRAM_MEDIA_CREATE` | `COMPOSIO_ACTION_INSTAGRAM` |
| TikTok | `TIKTOK_POST_VIDEO` | `COMPOSIO_ACTION_TIKTOK` |

Connected accounts: `COMPOSIO_CONNECTED_ACCOUNT_ID_X` /
`..._LINKEDIN` / `..._INSTAGRAM` / `..._TIKTOK` (values from the Composio
dashboard). If a platform's slug or account is missing, **only that platform**
is skipped and the failure is logged — other platforms keep posting. If an X
post with media is rejected, the engine retries text-only automatically.

> The exact action slugs differ per Composio app version — the env overrides
> exist so slugs can be corrected without code changes.

### Internal (Telegram Bot API)

- `sendPhoto` with the campaign image + caption (caption truncated to 900
  chars) and the app link appended; `sendMessage` fallback when there is no
  image.
- Batching: **25 users/second** (`Promise.allSettled` per 25-user batch, then a
  1s pause) — safely under Telegram's ~30 messages/sec global limit.
- Progress checkpoints are written to the campaign after every batch.

---

## 6. Cleanup

- 23:00 sweep finds campaigns with `status = "completed"` and
  `completedAt <= now - 24h`.
- For each: `ctx.storage.delete(storageId)` for the image and video, then the
  asset rows are marked `deletedAt` (unmarked rows are retried the next night).
- `failed` campaigns (broken generation) are swept after 48h.
- Keeps storage usage bounded: only `queued`/`generating`/`ready`/recently
  completed assets are retained.

---

## 7. Schedule (UTC)

| Time (UTC) | Job | Function |
| --- | --- | --- |
| 08:00 | Generate | `marketing.generator.generateCampaign` |
| 10:00 | Distribute | `marketing.distributor.runDistribution` |
| 23:00 | Cleanup | `marketing.cleaner.cleanupOldAssets` |

All times are UTC (`hourUTC`). For local times convert, e.g. Riyadh (UTC+3):
08:00 local = `hourUTC: 5`. Jobs can also be triggered manually:

```bash
npx convex run marketing/generator:generateCampaign '{theme:"30-day challenge", topic:"home workouts", brandColor:"#d7f26d"}' --prod
npx convex run marketing/distributor:runDistribution '{}' --prod
npx convex run marketing/cleaner:cleanupOldAssets '{}' --prod
```

---

## 8. Required environment variables

| Variable | Purpose |
| --- | --- |
| `HF_API_TOKEN` | Hugging Face Inference API (text + image + video) |
| `COMPOSIO_API_KEY` | Composio action execution |
| `TELEGRAM_BOT_TOKEN` | internal broadcast to app users (already used by payments) |
| `MARKETING_ENABLED` | master switch — must be exactly `"true"` or the engine stays dormant |
| `COMPOSIO_CONNECTED_ACCOUNT_ID_X` / `_LINKEDIN` / `_INSTAGRAM` / `_TIKTOK` | per-platform accounts |
| `COMPOSIO_ACTION_*` (optional) | override default action slugs |
| `MARKETING_TEXT_MODEL` / `MARKETING_IMAGE_MODEL` / `MARKETING_VIDEO_MODEL` (optional) | model overrides |
| `MARKETING_THEME` / `MARKETING_TOPIC` / `MARKETING_BRAND_COLOR` (optional) | defaults for the 08:00 cron run |
| `APP_URL` (optional) | link appended to Telegram messages (default: the Vercel app) |

```bash
npx convex env set HF_API_TOKEN <token> --prod
npx convex env set COMPOSIO_API_KEY <key> --prod
npx convex env set MARKETING_ENABLED true --prod
```

## 9. Error-handling contract

- Generation: every step (each platform caption, image, video) is wrapped in
  its own try/catch. Failures are appended to `marketing_logs` and the campaign
  still transitions to `ready` if *any* content was produced.
- Distribution: every channel is isolated — one failing platform never blocks
  the others or the Telegram broadcast.
- Cleanup: a failed `storage.delete` is logged and retried on the next nightly
  sweep (the asset row stays unmarked until success).
