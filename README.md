# FitAI — Fitness AI Mini App

A Telegram Mini App that combines an **AI coach** and **custom workout plans** with a
**points-based economy** and **Telegram Stars (XTR) payments**.

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 — built on the
  [Telekit](https://github.com/nikandr-surkov/telekit) foundation (Telegram WebApp provider,
  theme variables, types).
- **Backend:** [Convex](https://convex.dev) — realtime database, serverless functions,
  reactive `useQuery`-driven UI.

## Features

| Feature | How it works |
| --- | --- |
| Onboarding + welcome bonus | First launch registers the user and credits **50 points** (idempotent, single mutation). |
| Points economy | AI Coach = **5 pts**/query · Workout plan = **15 pts**/generation. Balance is checked & debited atomically server-side. |
| Telegram Stars payments | Point packages (50 pts / 10 ⭐, 150 pts / 25 ⭐). Invoice via Bot API, payment verified via the `successful_payment` webhook. |
| Dashboard | Live balance, point-history ledger, saved plans — all reactive via Convex queries. |
| Theming | `Telegram.WebApp.themeParams` drives CSS variables; light/dark adapt automatically. |
| Demo mode | Outside Telegram or without Convex, the app runs on in-memory data so the UI is previewable in a browser. |

## Architecture

```
Telegram Mini App (Next.js)
  ├─ UI (screens + components)          ── useAppData() ──┐
  ├─ ConvexAppDataProvider              ── useQuery/useMutation ──► Convex
  └─ API routes
       ├─ /api/invoice                  ── createInvoiceLink + createPending
       └─ /api/telegram/webhook         ── pre_checkout_query + successful_payment
```

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

- `users` — `tgId`, `name`, `pointsBalance`, `createdAt`
- `transactions` — immutable ledger (`amount` +/- , `type`, `pointsAfter`, `timestamp`)
- `workoutPlans` — saved generated plans
- `pointPackages` — server-side source of truth for prices
- `payments` — invoice state (pending → completed) + `telegramPaymentChargeId`

See [`convex/schema.ts`](convex/schema.ts) for the exact definition.

## Setup

### 1. Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/botfather)
- A free [Convex](https://dashboard.convex.dev) account
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
```

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
- Register the payment webhook:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<ngrok-or-domain>/api/telegram/webhook","secret_token":"<TELEGRAM_BOT_SECRET_TOKEN>"}'
```

## Demo mode

If `NEXT_PUBLIC_CONVEX_URL` is unset, or the app is opened outside Telegram, it runs with
in-memory mock data (`providers/DemoAppData.tsx`) so you can preview the whole UI in a
browser. Purchases are simulated. The real flows require Telegram + Convex.

## Swapping the mock AI for a real model

The coach/plan "AI" is a deterministic mock in [`convex/lib/mock.ts`](convex/lib/mock.ts).
To use a real model, replace `mockCoachResponse` / `generateMockPlan` with a call to your
provider (OpenAI, Claude, DeepSeek, etc.) inside a Convex **action** (actions may call
`fetch`), then call that action from `convex/points.ts`. Points charging and history remain
unchanged.

## License note

This project is built on the [Telekit](https://github.com/nikandr-surkov/telekit) boilerplate.
Telekit's README states MIT, but its individual source files carry a
"Proprietary — may ONLY be used if purchased" header. **Resolve this ambiguity before shipping**
and either obtain a Telekit license or replace the retained Telekit files
(`providers/TelegramProvider.tsx`, `store/telegram.ts`, `types/telegram.d.ts`, `hooks/useHaptic.ts`).
