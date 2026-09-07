import { NextRequest, NextResponse } from "next/server";
import { validate } from "@telegram-apps/init-data-node";
import { randomUUID } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get("X-Telegram-Init-Data");
    if (!initData) {
      return NextResponse.json({ error: "Missing init data" }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    // Validate the Telegram init data (throws on invalid signature / expiry).
    validate(initData, botToken);

    // Parse the authenticated user out of the (now validated) init data.
    // NOTE: we parse manually instead of using the package's `parse()`, which
    // in this version requires a `signature` field that regular Mini App
    // launches don't include.
    const userRaw = new URLSearchParams(initData).get("user");
    const tgUser = userRaw ? (JSON.parse(userRaw) as TgUser) : null;
    if (!tgUser) {
      return NextResponse.json({ error: "Missing user" }, { status: 401 });
    }

    const body = await req.json();
    const packageKey: string | undefined = body?.packageKey;
    if (!packageKey) {
      return NextResponse.json({ error: "Missing packageKey" }, { status: 400 });
    }

    const convexUrl = process.env.CONVEX_URL;
    const apiSecret = process.env.API_SECRET;
    if (!convexUrl || !apiSecret) {
      return NextResponse.json(
        { error: "Server not configured (CONVEX_URL/API_SECRET)" },
        { status: 500 },
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    const payload = `${tgUser.id}:${packageKey}:${randomUUID()}`;

    // Create the pending payment (returns server-side pricing — the client
    // never supplies the stars/points amount).
    const pending = await convex.mutation(api.payments.createPending, {
      secret: apiSecret,
      tgId: String(tgUser.id),
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Athlete",
      username: tgUser.username,
      packageKey,
      payload,
    });

    // Create the Telegram Stars invoice link.
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pending.title,
        description: pending.description,
        payload,
        provider_token: "", // empty for Telegram Stars
        currency: "XTR",
        prices: [{ label: pending.title, amount: pending.stars }],
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return NextResponse.json(
        { error: tgData.description ?? "Invoice creation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ invoiceLink: tgData.result });
  } catch (e) {
    console.error("create-invoice error", e);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
