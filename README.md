# FitAI — Fitness AI Mini App

A Telegram Mini App that combines a **DeepSeek-powered AI coach**, **custom workout plans**,
**exercise & progress tracking**, and a **points-based economy** with **Telegram Stars (XTR)
payments** — fully bilingual (English / العربية with RTL).

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 — a dark,
  chartreuse-accented fitness UI designed for Telegram Mini Apps.
- **Backend:** [Convex](https://convex.dev) — realtime database, serverless functions,
  reactive `useQuery`-driven UI.
- **AI:** DeepSeek — `deepseek-v4-flash` (text) and `deepseek-v4-flash-vision-exp` (vision),
  routed by capability through a small model registry.
- **Marketing:** a SaaS-style landing page (`/landing`, EN + AR, SEO/LLM-friendly) and a
  privacy policy page (`/privacy`) for BotFather.

## Features

| Feature | How it works |
| --- | --- |
| Onboarding questionnaire | First launch credits **250 welcome points**, then an 8-step wizard collects goal, level, experience, weekly days, equipment, body stats and limitations into a `userProfiles` record shown on the Profile page. |
| Points economy | AI Coach = **50 pts**/query · Plan = **250 pts** (welcome bonus covers your first plan) · Plan-edit proposal = **50 pts**. Balance is checked & debited atomically server-side. |
| AI Coach (DeepSeek) | Chat-style coach answers grounded in live context: profile, goals, saved plans, exercise logs, progress and chat history. Conversation persists across sessions. |
| Model switching by capability | A model registry (`convex/lib/models.ts`) routes text → `deepseek-v4-flash` and vision → `deepseek-v4-flash-vision-exp` (base64 image input, reasoning-model token budget). |
| Body photo analysis | Upload a photo in the Coach tab → stored in Convex → the vision model reviews posture/form against the profile and suggests plan corrections. |
| Plan editing with approval | "Change my plan" mode in the coach chat: the coach proposes structured edits (replace / update / add / remove exercises, sets, reps) and the user must **approve** before anything is applied. |
| Workout plans | Goal + level generator in the Plan tab (250 pts), prefilled from the onboarding profile. The user picks a **start and end date** for a program of **max 8 weeks (two months)** per generation, and every plan shows a **week-by-week progress chart**, its period and end date. |
| Exercise library | Plans draw from a curated subset of [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain) — every exercise shows its 2+ form images, muscle groups, equipment, and step-by-step instructions, **localized in Arabic**. |
| Exercise tracking | Tick/untick every exercise per day; per-day and per-plan progress bars update live. |
| Progress rollups | Plan-page summary shows **plan count, exercises done/total, the active plan's period & end date**, a **per-week progress bar chart**, plus completed-exercise counts for **today / week / month / all-time** — all stored in Convex and fed to the AI coach. |
| Telegram Stars payments | Top-up packages **500 pts / 50 ⭐** and **1000 pts / 100 ⭐**. Invoice via Bot API, payment verified via the `successful_payment` webhook. |
| Refunds | Admin `/refund <tgId>` command in the bot chat → `refundStarPayment` + points reversal with a `↩️ Refund` history entry. |
| English & Arabic | Full i18n layer (`lib/i18n`) with EN/AR dictionaries, automatic RTL, localized exercise names/instructions, and a language switcher in Profile + onboarding. |
| Feature requests | Profile → "Request a feature" popup form → stored in the `featureRequests` table. |
| Progress dashboard | Home tracks points, plans, workouts, coach calls, and a weekly activity bar chart built from real transactions. |
| Wallet & history | Profile shows balance, buy-points card, profile summary, feature shortcuts, language switcher, and the full point-history ledger. |
| Landing page | `/landing` — SaaS-style marketing page (EN/AR toggle) with metadata, Open Graph, sitemap, `robots.txt` and `llms.txt` for search/LLM discovery. |
| Privacy policy | `/privacy` — standalone policy page for the BotFather "Privacy Policy URL" setting. |
| Light/dark | Dark brand theme by default; a light variant applies for Telegram light theme. |
| Demo mode | Outside Telegram or without Convex, the app runs on in-memory data so the UI is previewable in a browser. |

## Architecture

```
Telegram Mini App (Next.js)
  ├─ UI (screens + components)            ── useAppData() ──┐
  ├─ ConvexAppDataProvider                ── useQuery/useMutation/useAction ──► Convex
  └─ API routes
       ├─ /api/invoice                    ── createInvoiceLink + createPending
       └─ /api/telegram/webhook           ── pre_checkout_query + successful_payment + refunds
```

**AI coach flow (text):**

1. Client calls the `coach:askCoach` **action** with `initData` + message.
2. Action → `ctx.runMutation(checkInitData)` (HMAC-validates initData, returns balance) →
   `ctx.runQuery(getCoachContext)` (profile + progress + plans + chat history).
3. Action calls DeepSeek with the system prompt (`prompts/coach-system.md`) + live context.
4. On success → `ctx.runMutation(finalizeCoach)` charges 5 pts, writes the ledger entry, and
   persists both chat messages.

Vision (`coach:analyzeBodyImage`) and plan editing (`coach:proposePlanEdit` →
`coach:applyPlanEdit`) follow the same action + `ctx.runMutation` pattern.

**Payment verification (authoritative flow):**

1. User taps **Buy** → `POST /api/invoice` (with `initData` in `X-Telegram-Init-Data`).
2. Route validates `initData` (HMAC), creates a `pending` payment in Convex, and calls the
   Bot API `createInvoiceLink` (`provider_token: ""`, `currency: "XTR"`). The client never
   supplies the price.
3. Frontend opens the invoice with `webApp.openInvoice(...)`. The callback only updates UI —
   **it never grants points**.
4. Telegram sends `pre_checkout_query` → webhook approves/rejects via `answerPreCheckoutQuery`.
5. Telegram sends `message.successful_payment` → webhook calls Convex `completePayment`, which
   credits points **idempotently** (keyed on `telegram_payment_charge_id`).

## Convex schema

- `users` — `tgId`, `name`, `pointsBalance`, `createdAt`, `onboarded`, `language`
- `userProfiles` — onboarding questionnaire answers
- `transactions` — immutable ledger (`amount` +/-, `type`, `pointsAfter`, `timestamp`)
- `workoutPlans` — saved generated plans (start/end dates + period in weeks ≤ 8, exercises with images + instructions)
- `exerciseLogs` — per-exercise completion ticks (day/week/month/all-time rollups)
- `coachMessages` — persisted AI coach conversation
- `pointPackages` — server-side source of truth for prices
- `payments` — invoice state (pending → completed) + `telegramPaymentChargeId`
- `featureRequests` — user-submitted feature requests

See [`convex/schema.ts`](convex/schema.ts) for the exact definition.

## Setup

### 1. Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/botfather)
- A free [Convex](https://dashboard.convex.dev) account
- A [DeepSeek](https://platform.deepseek.com) API key (one key powers text + vision)
- `ngrok` (or any HTTPS tunnel) for local Telegram testing

### 2. Install

```bash
npm install
cp .env.example .env.local
```

### 3. Configure Convex

```bash
npx convex dev          # logs you in, creates/selects a project, starts the dev backend
npx convex env set TELEGRAM_BOT_TOKEN <bot-token>
npx convex env set API_SECRET <random-secret>
npx convex env set DEEPSEEK_API_KEY <deepseek-key>     # prod: add --prod
npx convex run packages:seed   # seed the point packages
```

`npx convex dev` prints a deployment URL — put it in `.env.local` as **both**
`CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`.

### 4. Configure `.env.local`

```env
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_BOT_SECRET_TOKEN=<random-webhook-secret>
CONVEX_URL=<convex-url>
NEXT_PUBLIC_CONVEX_URL=<convex-url>
API_SECRET=<same-random-secret-as-convex>
DEEPSEEK_API_KEY=<deepseek-key>
```

> **Never commit `DEEPSEEK_API_KEY`.** `.env.local` is gitignored; store the key in the
> Convex deployment env (`npx convex env set DEEPSEEK_API_KEY <key> --prod`).

### 5. Run

```bash
npx convex dev          # terminal 1
npm run dev             # terminal 2
```

### 6. Expose to Telegram

```bash
ngrok http 3000
```

- Set your bot's **Menu Button** URL in BotFather to the ngrok HTTPS URL.
- Set the **Privacy Policy URL** in BotFather to `https://<your-domain>/privacy`.
- Register the payment webhook:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<ngrok-or-domain>/api/telegram/webhook","secret_token":"<TELEGRAM_BOT_SECRET_TOKEN>"}'
```

## AI prompts

Detailed system prompts live as markdown under [`prompts/`](prompts/):

- [`prompts/coach-system.md`](prompts/coach-system.md) — coach persona, safety rules, context usage
- [`prompts/vision-analysis.md`](prompts/vision-analysis.md) — body/form photo analysis contract
- [`prompts/plan-generator.md`](prompts/plan-generator.md) — plan-generation JSON contract (future LLM generator)

The runtime copies are exported from [`convex/lib/prompts.ts`](convex/lib/prompts.ts).

## Refunds (Telegram Stars)

Admin-only, driven from the bot chat:

1. Set `ADMIN_TG_ID` to your Telegram user id (get it from @userinfobot) in Vercel env.
2. In the bot chat, send **`/refund <tgId>`** — the bot replies with a button per refundable
   purchase (a purchase can only be refunded if the user still holds the purchased points).
3. Tap the button → the webhook calls Telegram's `refundStarPayment`, then Convex deducts
   the points, marks the payment `refunded`, and writes a `-N Refund (Stars)` ledger entry.
   The user sees "↩️ Refund" in their point history and the balance updates reactively.

## Demo mode

If `NEXT_PUBLIC_CONVEX_URL` is unset, or the app is opened outside Telegram, it runs with
in-memory mock data (`providers/DemoAppData.tsx`) so you can preview the whole UI in a
browser. Purchases, coach answers and photo analysis are simulated. The real flows require
Telegram + Convex.

## Exercise data

Plans use a curated subset of exercises from
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense / public domain),
vendored in [`convex/lib/exercises.ts`](convex/lib/exercises.ts) with **English and Arabic**
names/instructions. Exercise illustrations are served from the jsDelivr CDN mirror of the
library's GitHub assets.

## SEO / LLM discovery

- Landing page: `https://fitness-ai-mini-app.vercel.app/landing`
- Privacy policy: `https://fitness-ai-mini-app.vercel.app/privacy`
- `llms.txt`: `https://fitness-ai-mini-app.vercel.app/llms.txt`
- `robots.txt` + sitemap: `https://fitness-ai-mini-app.vercel.app/robots.txt`
