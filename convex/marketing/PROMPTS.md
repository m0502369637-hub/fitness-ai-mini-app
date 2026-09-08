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
├── crons.ts       # 18:00 generate / 19:00 distribute / 24:00 cleanup (Riyadh)
└── PROMPTS.md     # this file
```

`convex/crons.ts` (repo root) re-exports `marketing/crons.ts` because Convex only
reads the crons config from the root path.

---

## 1. Models

| Stage | Model | Env override |
| --- | --- | --- |
| Text (captions) | `meta-llama/Llama-3.1-8B-Instruct` (auto-routed) | `MARKETING_TEXT_MODEL` |
| Image | `stabilityai/stable-diffusion-3-medium-diffusers` | `MARKETING_IMAGE_MODEL` |
| Video | `Lightricks/LTX-Video-0.9.7-distilled` | `MARKETING_VIDEO_MODEL` |

> ⚠️ HF retired the legacy serverless API (`api-inference.huggingface.co`,
> 410 Gone, late 2025). All calls now go through the **router**:
>
> - **Text** — OpenAI-compatible `POST https://router.huggingface.co/v1/chat/completions`
>   with `{ model, messages, max_tokens }`; the router auto-selects the provider.
> - **Image** — `POST https://router.huggingface.co/hf-inference/models/{model}`
>   (HF Inference provider catalog; free-credit billed).
> - **Video** — the HF Inference provider does **not** serve video models in the
>   current catalog. To enable the video step, add a third-party provider key
>   (fal-ai / replicate / wavespeed) in your HF Inference Provider settings and
>   pin it via `MARKETING_VIDEO_MODEL=<model>:<provider>`. Until then the video
>   step logs its failure and the campaign proceeds with captions + image.
>
> The token must be a fine-grained token with the **"Make calls to Inference
> Providers"** permission. The original spec models (`meta-llama/Llama-3-8B-Instruct`,
> `black-forest-labs/FLUX.1-schnell`, `stabilityai/stable-video-diffusion-img2vid-xt`)
> are retired upstream; the ids above are their current-generation replacements.

All calls use the standard `Authorization: Bearer <HF_API_TOKEN>` header and
`x-wait-for-model: true` (blocks until the model is loaded instead of returning
503). 429/503/5xx, timeouts and network errors are retried with exponential
backoff.

**Text fallback:** if the HF call fails for any reason (token scope, provider
catalog gap, network), the engine transparently retries the same prompt with
the app's DeepSeek model (`DEEPSEEK_API_KEY` + `deepseek-v4-flash`), so caption
generation keeps working. Disable with `MARKETING_TEXT_FALLBACK=off`.

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

Facebook:       "Write one engaging post of 100-150 words with a conversational
                tone. End with one clear question that sparks comments and one
                soft call-to-action. 3-5 hashtags."

TikTok:         "Write one short punchy caption under 140 characters, hook
                first. 4-6 hashtags including one trending fitness tag."
```

Generation parameters: `max_new_tokens: 220, temperature: 0.85, do_sample: true,
return_full_text: false`.

The reply is parsed as JSON with a graceful fallback: if the model returns
plain text, the whole text becomes the caption and `#hashtags` are extracted
with a regex scan. **Every caption is post-processed to guarantee the app link**
`https://t.me/FitAI_Training_bot` is present (appended if the model missed it;
X captions are trimmed to stay within the character budget). Override the link
with `APP_URL`.

---

## 3. Image prompt

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

The model returns raw image bytes (or a JSON base64 payload — both handled);
the engine stores them with `ctx.storage.store()` and records both the
`storageId` and the public `storage.getUrl()` result.

---

## 4. Video prompt

The video stage is **image-to-video**: the input is the image generated in
step 3. Two attempts, in order:

1. **Hugging Face router** — model id from `MARKETING_VIDEO_MODEL`, image passed
   as a base64 data URL (`{inputs: dataUrl}` / `{inputs: {image: dataUrl}}`).
2. **fal-ai fallback (Seedance)** — `fal-ai/bytedance/seedance/v1/pro/image-to-video`
   via the fal queue API (`https://queue.fal.run/<endpoint>`):
   submit `{ prompt, image_url, duration: "5s" }` → poll the request status →
   download `data.video.url`. Requires `FAL_API_KEY` (free credits on signup at
   fal.ai); override with `FAL_VIDEO_ENDPOINT` / `FAL_VIDEO_DURATION`.

```text
prompt: "Slow cinematic camera push-in on the athlete, subtle dynamic movement,
         dramatic rim light, professional fitness advertisement style,
         <theme>, <topic>, no text, no watermark"
```

If both attempts fail, the step logs the combined error and the campaign
continues with captions + image.

---

## 5. Distribution

### External (Composio API v3.1)

`POST https://backend.composio.dev/api/v3.1/tools/execute/{tool_slug}`

```json
{
  "connected_account_id": "<from env>",
  "arguments": { "...": "tool-specific input" }
}
```

| Platform | Tool flow | Extra env |
| --- | --- | --- |
| X | `TWITTER_UPLOAD_MEDIA` → `TWITTER_CREATION_OF_A_POST` (text-only retry) | — |
| Facebook | `FACEBOOK_CREATE_PHOTO_POST` | `COMPOSIO_FACEBOOK_PAGE_ID` (Page id) |
| Instagram | `INSTAGRAM_POST_IG_USER_MEDIA` → `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH` | `COMPOSIO_INSTAGRAM_IG_USER_ID` (professional account id) |
| LinkedIn | `LINKEDIN_CREATE_LINKED_IN_POST` | `COMPOSIO_LINKEDIN_AUTHOR` (e.g. `urn:li:person:XXXX`) |
| TikTok (optional) | `TIKTOK_POST_VIDEO` | — |

Connected accounts: `COMPOSIO_CONNECTED_ACCOUNT_ID_X` /
`..._FACEBOOK` / `..._LINKEDIN` / `..._INSTAGRAM` (nanoids from
`GET /api/v3/connected_accounts` in the Composio dashboard/API). Tool slugs are
overridable via `COMPOSIO_ACTION_*`. If a platform's config is missing, **only
that platform** is skipped and the failure is logged — other platforms keep
posting. If an X post with media is rejected, the engine retries text-only
automatically.

### Internal (Telegram Bot API)

- `sendPhoto` with the campaign image + caption (caption truncated to 900
  chars) and the app link (`APP_URL`, default `https://t.me/FitAI_Training_bot`)
  appended; `sendMessage` fallback when there is no image.
- Batching: **25 users/second** (`Promise.allSettled` per 25-user batch, then a
  1s pause) — safely under Telegram's ~30 messages/sec global limit.
- Progress checkpoints are written to the campaign after every batch.

---

## 6. Cleanup

- 24:00 Riyadh sweep finds campaigns with `status = "completed"` and
  `completedAt <= now - 24h`.
- For each: `ctx.storage.delete(storageId)` for the image and video, then the
  asset rows are marked `deletedAt` (unmarked rows are retried the next night).
- `failed` campaigns (broken generation) are swept after 48h.
- Keeps storage usage bounded: only `queued`/`generating`/`ready`/recently
  completed assets are retained.

---

## 7. Schedule

| Time (Riyadh, UTC+3) | Time (UTC) | Job | Function |
| --- | --- | --- | --- |
| 18:00 | 15:00 | Generate | `marketing.generator.generateCampaign` |
| 19:00 | 16:00 | Distribute | `marketing.distributor.runDistribution` |
| 24:00 | 21:00 | Cleanup | `marketing.cleaner.cleanupOldAssets` |

Cron schedules are configured in UTC (`hourUTC`). Jobs can also be triggered
manually:

```bash
npx convex run marketing/generator:generateCampaign '{theme:"30-day challenge", topic:"home workouts", brandColor:"#d7f26d"}' --prod
npx convex run marketing/distributor:runDistribution '{}' --prod
npx convex run marketing/cleaner:cleanupOldAssets '{}' --prod
```

---

## 8. Required environment variables

| Variable | Purpose |
| --- | --- |
| `HF_API_TOKEN` | Hugging Face router (captions via chat completions + image via HF Inference provider) |
| `COMPOSIO_API_KEY` | Composio v3.1 tool execution |
| `TELEGRAM_BOT_TOKEN` | internal broadcast to app users (already used by payments) |
| `MARKETING_ENABLED` | master switch — must be exactly `"true"` or the engine stays dormant |
| `COMPOSIO_CONNECTED_ACCOUNT_ID_X` / `_FACEBOOK` / `_LINKEDIN` / `_INSTAGRAM` | per-platform connected accounts |
| `COMPOSIO_FACEBOOK_PAGE_ID` / `COMPOSIO_INSTAGRAM_IG_USER_ID` / `COMPOSIO_LINKEDIN_AUTHOR` | account ids the posting tools need |
| `FAL_API_KEY` (optional) | fal-ai Seedance video fallback (free key at fal.ai) |
| `COMPOSIO_ACTION_*` (optional) | override default tool slugs |
| `MARKETING_TEXT_MODEL` / `MARKETING_IMAGE_MODEL` / `MARKETING_VIDEO_MODEL` (optional) | model overrides |
| `MARKETING_THEME` / `MARKETING_TOPIC` / `MARKETING_BRAND_COLOR` (optional) | defaults for the 18:00 cron run |
| `APP_URL` (optional) | app link in every caption + Telegram messages (default: https://t.me/FitAI_Training_bot) |

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
