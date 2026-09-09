# Marketing Engine — Prompts & Operating Manual

This document is the single source of truth for the **Autonomous Marketing OS**
(`convex/marketing/`). It lists every AI prompt the engine sends, the model
configuration, the required environment variables, and the schedule.

**All marketing content — captions, hashtags, Telegram broadcasts and the video
prompt — is produced in Arabic** (Modern Standard Arabic, energetic tone).

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

## 2. Text prompts — Saudi Arabic, human voice

**All marketing POSTS are written in Saudi white dialect** (فصحى خفيفة مخلوطة
بالعامية السعودية) so they read like a real Saudi person, not AI. Generation
prompts (image/video) stay English — only the posted copy is Arabic.

**Caption model order:** DeepSeek first (by far the best Arabic), Hugging Face
Router as fallback. Disable the fallback with `MARKETING_TEXT_FALLBACK=off`.

### System prompt (all platforms)

```text
أنت سعودي تكتب منشورات تسويقية لتطبيق FitAI، تطبيق لياقة مجاني داخل تيليجرام.
اكتب باللهجة السعودية البيضاء: فصحى خفيفة مخلوطة بالعامية السعودية، كأنك تنصح صاحبك في الجلسة.
استخدم كلمات عامية طبيعية مثل: الحين، وش تنتظر، مره، يالله، حماس، روق، عساك، ترى، ولا أحلى.
اكتب كأن إنسان حقيقي كتبها — لا تبدو مكتوبة بالذكاء الاصطناعي.
ممنوع: العبارات الجاهزة والمبالغات الإعلانية (مثل «ثورة في عالم اللياقة»، «لا تفوّت الفرصة»، «اكتشف السر»)، وممنوع كثرة الإيموجي.
لا تكتب أي تفكير أو شرح — أخرج JSON فوراً.
أجب بـ JSON فقط: {"caption":"...","hashtags":["..."]}.
```

### User prompt template

```text
<PLATFORM_INSTRUCTIONS>
موضوع الحملة: <theme>.
الموضوع المركّز: <topic>.
لون العلامة المميز: <brandColor> (اذكره فقط إن كان طبيعياً).
اذكر بشكل خفيف أن FitAI تطبيق تيليجرام مجاني.
اكتب بنبرة إنسان سعودي حقيقي — خفيفة، مباشرة، بدون مبالغات إعلانية.
اختم الوصف دائماً برابط التطبيق: https://t.me/FitAI_Training_bot مع الالتزام بحد الطول لكل منصة.
أجب بـ JSON فقط: {"caption":"...","hashtags":["..."]} بدون أي تنسيق إضافي.
```

### Platform instructions

```text
X (Twitter):    "المنصة: إكس (تويتر). اكتب تغريدة عفوية بلهجة سعودية، بحد
                أقصى 250 حرفاً. ابدأ بجملة توقف التمرير مثل «ترى …» أو
                «وش تنتظر؟». 2-3 وسمات فقط."

LinkedIn:       "المنصة: لينكدإن. اكتب منشوراً احترافياً من 800-1100 حرف.
                افتتاحية قصة قصيرة، ثم ثلاث نقاط قيمة، ثم دعوة لطيفة.
                عربية فصيحة أقرب للرسمية مع لمسة عامية خفيفة جداً. 3 وسمات."

Instagram:      "المنصة: إنستغرام. اكتب كابشن حماسي بلهجة سعودية من 130-180
                كلمة مع فواصل أسطر و2-3 إيموجي كحد أقصى. الدعوة: افتح FitAI
                على تيليجرام. 8-10 وسمات لياقة."

Facebook:       "المنصة: فيسبوك. اكتب منشوراً من 100-150 كلمة بأسلوب سوالف
                مع الأصدقاء، فيه نبرة سعودية دافية. اختم بسؤال يشجع
                التعليقات ودعوة خفيفة. 3-5 وسمات."

TikTok:         "المنصة: تيك توك. اكتب وصفاً قصيراً بلهجة سعودية أقل من 140
                حرفاً، ابدأ بأقوى جملة. 4-6 وسمات منها وسم لياقة رائج."
```

Generation parameters (DeepSeek primary): `maxTokens 4000, temperature 0.7`
(reasoning model — the budget keeps reasoning from starving the caption).

The reply is parsed as JSON with a graceful fallback: if the model returns
plain text, the whole text becomes the caption and `#hashtags` are extracted
with a regex scan (Arabic tags supported). **Every caption is post-processed
to guarantee the app link** `https://t.me/FitAI_Training_bot` is present
(appended if the model missed it; X captions are trimmed to stay within the
character budget). Override the link with `APP_URL`.

Defaults (`MARKETING_THEME` / `MARKETING_TOPIC` overridable):
`تحول لياقي خلال 30 يوماً` · `تمارين منزلية سريعة بدون معدات`.

---

## 3. Image prompt (English)

Generation prompts stay English (image/video models follow English direction
best); only the posted copy is Arabic.

```text
Cinematic fitness photograph, <theme> featuring <topic>,
dominant accent color <brandColor> on training apparel, gym equipment and rim lighting,
realistic Middle Eastern people, moody dark background, dramatic rim light,
shallow depth of field, 35mm lens, ultra high resolution,
professional sports advertising aesthetic, no text, no watermark, no logo
```

- `<theme>` — e.g. `تحول لياقي خلال 30 يوماً`
- `<topic>` — e.g. `تمارين منزلية سريعة بدون معدات`
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
fresh. The pool (stored in English — the prompt is English):

| # | Pain (story opening) | Value (resolution — what FitAI delivers) |
| --- | --- | --- |
| 1 | Busy professional, no time for the gym | Personal plan in minutes, fits any schedule, inside Telegram |
| 2 | Generic one-size-fits-all plans never work | Plan built from your goal, level and timeline, adapted by AI |
| 3 | Trainers and memberships are too expensive | An AI coach in your pocket for a fraction of the cost |
| 4 | Motivation dies after week one | Streaks + progress charts keep you going |
| 5 | Beginners don't know which exercises to do | Step-by-step images and instructions for every exercise |
| 6 | Training without knowing if you're improving | Day/week/month progress analytics |

### Assembled prompt (English)

```text
Vertical 9:16 marketing video for FitAI, an AI-powered fitness coach mini app
on Telegram that builds personalized workout plans, tracks daily progress and
costs less than a gym membership.
Story: <pain>.
Then show the resolution — <value>.
Campaign topic: <topic>. Campaign theme: <theme>.
Visual style: cinematic, high-energy, moody dark background with lime-chartreuse
#d7f26d accents, a hand holding a phone with the app open, modern and
aspirational, fast-paced cuts, realistic Middle Eastern people.
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
| X | `TWITTER_UPLOAD_MEDIA` → `TWITTER_CREATION_OF_A_POST` (text-only retry, then direct X API) | — |
| Facebook | `FACEBOOK_CREATE_PHOTO_POST` (`published: true`; image uploaded via Composio files, URL fallback) | `COMPOSIO_FACEBOOK_PAGE_ID` (Page id) |
| Instagram | `INSTAGRAM_POST_IG_USER_MEDIA` → `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH` | `COMPOSIO_INSTAGRAM_IG_USER_ID` (professional account id) |
| LinkedIn | `LINKEDIN_CREATE_LINKED_IN_POST` | `COMPOSIO_LINKEDIN_AUTHOR` (e.g. `urn:li:person:XXXX`) |
| TikTok (optional) | `TIKTOK_POST_VIDEO` | — |

**Media uploads (X/Facebook):** Composio media tools take a FileUploadable
`{name, s3key, mimetype}` — inline base64 is not accepted. The engine uses the
v3 two-step flow: `POST /api/v3/files/upload/request`
`{toolkit_slug, tool_slug, filename, mimetype, md5}` → PUT the bytes to the
returned `new_presigned_url` → pass the returned `key` as `s3key`. MD5 is
computed in-app (Web Crypto has no MD5). Facebook falls back to the public
`url` if the upload fails.

**Response envelopes are validated:** Composio often returns HTTP 200 with the
failure inside the body (`error`, `successful: false`, `data.error`) — such
envelopes are treated as failures and logged, never as phantom "sent" posts.
Every successful platform post logs its raw response snippet, and the X
fallback chain records all three stage errors (`media:` / `text-only:` /
`direct:`).

> ⚠️ **X requires API credits.** Posting tweets calls the X API v2
> `/2/tweets` endpoint; when the developer account's credits run out it
> returns `402 credits depleted` and no post is possible (media uploads on
> v1.1 still succeed). Top up the app's tier at developer.x.com when this
> appears in the logs.
>
> ⚠️ **Facebook page id:** the env must match a page the connected account
> actually manages — Composio lists the available ids in its error message
> (e.g. `page_id:12667-18683-19824-2` → use `1266718683198242`).

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
  appended; `sendMessage` fallback `🔥 جديد من FitAI 👉 <link>` when there is no
  image. Captions are Arabic like every other piece of marketing content.
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
- The **newest completed campaign is exempt**: it is the source material for
  the daily repurposing posts, so its assets are kept until a newer campaign
  supersedes it.
- Keeps storage usage bounded: only `queued`/`generating`/`ready`, recently
  completed campaigns and the active repurpose source are retained.

---

## 7. Schedule — generation 3×/week, distribution every day

Generation costs money (HF + fal.ai credits), so it runs **three times a week
(Tue/Thu/Sat)**. Distribution is free (Composio + Telegram), so it runs
**every day**: on days without a fresh campaign the distributor **repurposes**
the latest completed one — same image/video, platform-native captions with a
rotating Arabic hook prefix (`🚀 جاهز تبدأ؟` / `💪 اليوم أفضل وقت` / …) so
consecutive posts differ.

| Day (Riyadh, UTC+3) | Time (Riyadh) | Time (UTC) | Job | Function |
| --- | --- | --- | --- | --- |
| **Tue · Thu · Sat** | 18:00 | 15:00 | Generate | `marketing.generator.generateCampaign` |
| **Every day** | 19:00 | 16:00 | Distribute | `marketing.distributor.runDistribution` (fresh campaign, or repurpose of the latest completed one) |
| **Every day** | 24:00 | 21:00 | Cleanup | `marketing.cleaner.cleanupOldAssets` (the newest completed campaign is exempt — it is the repurpose source) |

Convex's cron scheduler has no weekday filter, so the generation cron is
registered daily and passes `respectSchedule: true`; the action checks the
marketing-day calendar (`convex/marketing/schedule.ts` — Riyadh weekday) and
no-ops on other days. The distribution cron passes `repurpose: true`. Manual
triggers ignore the calendar and run any day:

```bash
npx convex run marketing/generator:generateCampaign '{}' --prod
npx convex run marketing/distributor:runDistribution '{}' --prod               # latest ready campaign
npx convex run marketing/distributor:runDistribution '{repurpose:true}' --prod # force daily repurpose
npx convex run marketing/generator:cancelCampaign '{campaignId:"<id>", reason:"..."}' --prod  # retire a campaign before it posts
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
