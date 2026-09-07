import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

/**
 * Telegram payment webhook. Set it with:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://<your-domain>/api/telegram/webhook",
 *     "secret_token": "<TELEGRAM_BOT_SECRET_TOKEN>" }
 *
 * Handles pre_checkout_query (approve/reject) and successful_payment (credit
 * points idempotently).
 */
export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const webhookSecret = process.env.TELEGRAM_BOT_SECRET_TOKEN;
  if (!webhookSecret || secretHeader !== webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const convexUrl = process.env.CONVEX_URL;
  const apiSecret = process.env.API_SECRET;
  if (!botToken || !convexUrl || !apiSecret) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  const convex = new ConvexHttpClient(convexUrl);

  try {
    const update = await req.json();

    // 1. Pre-checkout query — approve only if the pending payment exists.
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      let ok = false;
      try {
        const pending = await convex.query(api.payments.getPending, {
          payload: q.invoice_payload,
        });
        ok = Boolean(pending && pending.status === "pending");
      } catch {
        ok = false;
      }

      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: q.id,
          ok,
          ...(ok ? {} : { error_message: "Payment not found or already processed" }),
        }),
      });

      return NextResponse.json({ ok: true });
    }

    // 2. Successful payment — credit points (idempotent in Convex).
    if (update.message?.successful_payment) {
      const p = update.message.successful_payment;
      await convex.mutation(api.payments.completePayment, {
        secret: apiSecret,
        payload: p.invoice_payload,
        telegramPaymentChargeId: p.telegram_payment_charge_id,
        totalAmount: p.total_amount,
        currency: p.currency,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("telegram-webhook error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
