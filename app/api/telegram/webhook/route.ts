import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

async function tgApi(method: string, params: Record<string, unknown>, botToken: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json() as Promise<{ ok: boolean; description?: string; result?: unknown }>;
}

/**
 * Telegram payment webhook. Set it with:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://<your-domain>/api/telegram/webhook",
 *     "secret_token": "<TELEGRAM_BOT_SECRET_TOKEN>" }
 *
 * Handles:
 *  - pre_checkout_query (approve/reject)
 *  - successful_payment (credit points idempotently)
 *  - /refund <tgId> admin command (list refundable purchases with buttons)
 *  - callback_query refund:<payload> (execute refundStarPayment + reverse points)
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
  const adminTgId = process.env.ADMIN_TG_ID;
  if (!botToken || !convexUrl || !apiSecret) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  const convex = new ConvexHttpClient(convexUrl);

  try {
    const update = await req.json();

    // 1. Admin command: /refund <tgId>
    const msgText: string | undefined = update.message?.text;
    if (msgText && msgText.startsWith("/refund")) {
      const fromId = String(update.message?.from?.id ?? "");
      const chatId: number | undefined = update.message?.chat?.id;
      if (chatId) {
        await handleRefundCommand(convex, botToken, chatId, fromId, msgText, adminTgId);
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Admin refund confirmation callback
    if (update.callback_query) {
      const cb = update.callback_query;
      const fromId = String(cb.from?.id ?? "");
      const isAdmin = adminTgId !== undefined && fromId === adminTgId;

      if (!isAdmin) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id }, botToken);
        return NextResponse.json({ ok: true });
      }

      const data: string = cb.data ?? "";
      if (!data.startsWith("refund:")) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id }, botToken);
        return NextResponse.json({ ok: true });
      }

      const payload = data.slice("refund:".length);
      await handleRefundCallback(convex, botToken, cb, payload, apiSecret);
      return NextResponse.json({ ok: true });
    }

    // 3. Pre-checkout query — approve only if the pending payment exists.
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      let ok = false;
      try {
        const pending = await convex.query(api.payments.getByPayload, {
          payload: q.invoice_payload,
        });
        ok = Boolean(pending && pending.status === "pending");
      } catch {
        ok = false;
      }

      await tgApi(
        "answerPreCheckoutQuery",
        {
          pre_checkout_query_id: q.id,
          ok,
          ...(ok ? {} : { error_message: "Payment not found or already processed" }),
        },
        botToken,
      );

      return NextResponse.json({ ok: true });
    }

    // 4. Successful payment — credit points (idempotent in Convex).
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

async function handleRefundCommand(
  convex: ConvexHttpClient,
  botToken: string,
  chatId: number,
  fromId: string,
  msgText: string,
  adminTgId: string | undefined,
) {
  try {
    const isAdmin = adminTgId !== undefined && fromId === adminTgId;
    if (!isAdmin) {
      await tgApi(
        "sendMessage",
        { chat_id: chatId, text: "For refund requests, please contact the bot owner." },
        botToken,
      );
      return;
    }

    const tgId = msgText.split(/\s+/)[1];
    if (!tgId) {
      await tgApi(
        "sendMessage",
        { chat_id: chatId, text: "Usage: /refund <tgId> — e.g. /refund 976417275" },
        botToken,
      );
      return;
    }

    const user = await convex.query(api.users.getByTgId, { tgId });
    if (!user) {
      await tgApi(
        "sendMessage",
        { chat_id: chatId, text: "No user found with that Telegram ID." },
        botToken,
      );
      return;
    }

    const payments = await convex.query(api.payments.listCompletedByUser, {
      userId: user._id,
    });
    if (payments.length === 0) {
      await tgApi(
        "sendMessage",
        { chat_id: chatId, text: `No refundable purchases for ${user.name}.` },
        botToken,
      );
      return;
    }

    await tgApi(
      "sendMessage",
      {
        chat_id: chatId,
        text: `Refundable purchases for ${user.name}${user.username ? ` (@${user.username})` : ""}:`,
        reply_markup: {
          inline_keyboard: payments.map((p) => [
            {
              text: `Refund ${p.stars}⭐ (${p.points} pts) — ${new Date(p.createdAt).toLocaleDateString()}`,
              callback_data: `refund:${p.payload}`,
            },
          ]),
        },
      },
      botToken,
    );
  } catch (e) {
    console.error("refund command error", e);
    await tgApi(
      "sendMessage",
      { chat_id: chatId, text: "Something went wrong. Please try again." },
      botToken,
    );
  }
}

async function handleRefundCallback(
  convex: ConvexHttpClient,
  botToken: string,
  cb: { id: string; data?: string },
  payload: string,
  apiSecret: string,
) {
  try {
    const payment = await convex.query(api.payments.getByPayload, { payload });
    if (!payment || payment.status !== "completed" || !payment.telegramPaymentChargeId) {
      await tgApi(
        "answerCallbackQuery",
        {
          callback_query_id: cb.id,
          text: "Payment not found or not refundable.",
          show_alert: true,
        },
        botToken,
      );
      return;
    }

    // Pre-flight: the user must still hold the purchased points.
    const user = await convex.query(api.users.getUser, { userId: payment.userId });
    if (!user || user.pointsBalance < payment.points) {
      await tgApi(
        "answerCallbackQuery",
        {
          callback_query_id: cb.id,
          text: "Can't refund — the user's points were already spent (balance too low).",
          show_alert: true,
        },
        botToken,
      );
      return;
    }

    // Refund the Stars on Telegram's side.
    const tgRes = await tgApi(
      "refundStarPayment",
      {
        user_id: Number(user.tgId),
        telegram_payment_charge_id: payment.telegramPaymentChargeId,
      },
      botToken,
    );

    if (!tgRes.ok) {
      await tgApi(
        "answerCallbackQuery",
        {
          callback_query_id: cb.id,
          text: `Refund failed: ${tgRes.description ?? "unknown Telegram error"}`,
          show_alert: true,
        },
        botToken,
      );
      return;
    }

    // Reverse the points + mark refunded (atomic in Convex).
    const result = await convex.mutation(api.payments.recordRefund, {
      secret: apiSecret,
      payload,
    });

    if (!result.ok) {
      await tgApi(
        "answerCallbackQuery",
        {
          callback_query_id: cb.id,
          text: `Stars were refunded, but the point reversal failed (${result.reason}).`,
          show_alert: true,
        },
        botToken,
      );
      return;
    }

    await tgApi(
      "answerCallbackQuery",
      {
        callback_query_id: cb.id,
        text: "✅ Refunded! Stars returned to the user and points deducted.",
        show_alert: true,
      },
      botToken,
    );
  } catch (e) {
    console.error("refund callback error", e);
    await tgApi(
      "answerCallbackQuery",
      {
        callback_query_id: cb.id,
        text: "Refund failed (internal error).",
        show_alert: true,
      },
      botToken,
    );
  }
}
