# Marketing Engine — Prompts & Operating Manual

This document is the single source of truth for the **Autonomous Marketing OS**
(`convex/marketing/`). It lists every AI prompt the engine sends, the model
configuration, the required environment variables, and the schedule.

```
convex/marketing/
├── schema.ts      # tables merged into the app schema (campaigns/assets/logs/distributions)
├── internals.ts   # internal mutations/queries (actions can't touch the DB directly)
├── generator.ts   # captions (HF/DeepSeek) + image (HF) + video (fal.ai workflow)
├── distributor.ts # Composio (X/LinkedIn/Instagram/Facebook) + Telegram Bot API broadcast
├── cleaner.ts     # deletes stored files 24h after a campaign completes
├── crons.ts       # 18:00 generate / 19:00 distribute / 24:00 cleanup — drops on Tue/Thu/Sat
├── schedule.ts    # marketing-day calendar (Tue/Thu/Sat, Riyadh) + day-of-week guard
└── PROMPTS.md     # this file
```

`convex/crons.ts` (repo root) re-exports `marketing/crons.ts` because Convex only
reads the crons config from the root path.

---

## 1. Models

| Stage | Model / provider | Env override |
| --- | --- | --- |
| Text (captions) | `meta-llama/Llama-3.1-8B-Instruct` (HF Router, auto-routed) → DeepSeek fallback | `MARKETING_TEXT_MODEL` |
| Image | `stabilityai/stable-diffusion-3-medium-diffusers` (HF Inference provider) | `MARKETING_IMAGE_MODEL` |
| Video | fal.ai workflow `kling-multi-shot-creator` (**prompt-only, no image input**) | `FAL_WORKFLOW_ENDPOINT` |

> ⚠️ HF retired the legacy serverless API (`api-inference.huggingface.co`,
> 410 Gone, late 2025). All calls now go through the **router**:
>
> - **Text** — OpenAI-compatible `POST https://router.huggingface.co/v1/chat/completions`
>   with `{ model, messages, max_tokens }`; the router auto-selects the provider.
> - **Image** — `POST https://router.huggingface.co/hf-inference/models/{model}`
>   (HF Inference provider catalog; free-credit billed).
> - **Video** — no longer generated through HF at all. It comes from the fal.ai
>   workflow endpoint below, which takes only a prompt and returns a finished clip.

The token must be a fine-grained token with the **"Make calls to Inference
Providers"** permission. The original spec models (`meta-llama/Llama-3-8B-Instruct`,
`black-forest-labs/FLUX.1-schnell`, `stabilityai/stable-video-diffusion-img2vid-xt`)
are retired upstream; the ids above are their current-generation replacements.

All HF calls use the standard `Authorization: Bearer <HF_API_TOKEN>` header and
`x-wait-for-model: true` (blocks until the model is loaded instead of returning
503). 429/503/5xx, timeouts and network errors are retried with exponential
backoff.

**Text fallback:** if the HF call fails for any reason (token scope, provider
catalog gap, network), the engine transparently retries the same prompt with
the app's DeepSeek model (`DEEPSEEK_API_KEY` + `deepseek-v4-flash`), so caption
generation keeps working. Disable with `MARKETING_TEXT_FALLBACK=off`.

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

## 4. Video prompt (fal.ai workflow)

The video stage is a **single fal.ai workflow call**. The endpoint takes
**only a `prompt`** — no image input, no duration, no other parameters:

```
POST https://fal.run/workflows/m0502369637-hub/kling-multi-shot-creator/stream
Authorization: Key <FAL_API_KEY>
Content-Type: application/json

{ "prompt": "<videoMarketingPrompt>" }
```

The workflow streams progress events (NDJSON / SSE-style `data:` lines) and the
engine scans the stream for the finished video URL, then downloads and stores
it in Convex File Storage like every other asset. Override the endpoint with
`FAL_WORKFLOW_ENDPOINT`; the wait budget is 9 minutes (`FAL_WORKFLOW_TIMEOUT_MS`,
capped by Convex's action timeout).

### The marketing angle (the point of the clip)

The clip must **market FitAI itself — its value proposition — not a gym promo
or a workout demonstration**. Each campaign draws one angle from a rotating
pool of pain→value pairs ("mix for marketing"), so consecutive drops stay
fresh. The pool:

| # | Pain (story opening) | Value (resolution — what FitAI delivers) |
| --- | --- | --- |
| 1 | Busy professional, no time for the gym | Personal plan in minutes, fits any schedule, inside Telegram |
| 2 | Generic one-size-fits-all plans never work | Plan built from your goal, level and timeline, adapted by AI |
| 3 | Trainers and memberships are too expensive | An AI coach in your pocket for a fraction of the cost |
| 4 | Motivation dies after week one | Streaks + progress charts keep you going |
| 5 | Beginners don't know which exercises to do | Step-by-step images and instructions for every exercise |
| 6 | Training without knowing if you're improving | Day/week/month progress analytics |

### Assembled prompt

```text
Vertical 9:16 marketing video for FitAI, an AI-powered fitness coach mini app
on Telegram that builds personalized workout plans, tracks daily progress and
costs less than a gym membership.
Story: <pain>.
Then show the resolution — <value>.
Campaign topic: <topic>. Campaign theme: <theme>.
Visual style: cinematic, high-energy, moody dark background with lime-chartreuse
#d7f26d accents, a hand holding a phone with the app open, modern and
aspirational, fast-paced cuts, realistic people.
This is app marketing, not a gym promo: show the lifestyle pain turning into
relief through the app — do not show a generic gym workout demonstration.
No text, no captions, no watermark, no logos in the frame.
```

If the workflow fails, the step logs the error and the campaign continues with
captions + image (the Instagram Reel then falls back to the image).

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

## 7. Schedule — three drops a week (Tue / Thu / Sat)

| Day (Riyadh, UTC+3) | Time (Riyadh) | Time (UTC) | Job | Function |
| --- | --- | --- | --- | --- |
| Tue · Thu · Sat | 18:00 | 15:00 | Generate | `marketing.generator.generateCampaign` |
| Tue · Thu · Sat | 19:00 | 16:00 | Distribute | `marketing.distributor.runDistribution` |
| **Every day** | 24:00 | 21:00 | Cleanup | `marketing.cleaner.cleanupOldAssets` |

Convex's cron scheduler has no weekday filter, so generate/distribute are
registered as daily jobs that pass `respectSchedule: true`; the actions check
the marketing-day calendar (`convex/marketing/schedule.ts` — Riyadh weekday) and
no-op on any other day. Cleanup is pure storage hygiene and keeps its daily
sweep. Manual triggers ignore the calendar and run any day:

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
| `FAL_API_KEY` | fal.ai — powers the video workflow (`kling-multi-shot-creator`) |
| `FAL_WORKFLOW_ENDPOINT` (optional) | override the video workflow URL (default: `https://fal.run/workflows/m0502369637-hub/kling-multi-shot-creator/stream`) |
| `FAL_WORKFLOW_TIMEOUT_MS` (optional) | max wait for the workflow stream in ms (default: 540000 = 9 min) |
| `COMPOSIO_ACTION_*` (optional) | override default tool slugs |
| `MARKETING_TEXT_MODEL` / `MARKETING_IMAGE_MODEL` (optional) | HF model overrides |
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
