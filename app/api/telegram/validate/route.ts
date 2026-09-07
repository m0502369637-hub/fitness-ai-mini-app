import { NextRequest, NextResponse } from "next/server";
import { validate } from "@telegram-apps/init-data-node";

export async function POST(request: NextRequest) {
  const { initData } = await request.json();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ valid: false, error: "Server not configured" }, { status: 500 });
  }

  try {
    // Validate the init data (throws if invalid)
    validate(initData, botToken);

    const userRaw = new URLSearchParams(initData).get("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    return NextResponse.json({ valid: true, user });
  } catch (error) {
    return NextResponse.json({ valid: false, error: "Invalid init data" }, { status: 401 });
  }
}
