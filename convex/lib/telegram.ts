// Server-side Telegram initData validation for the Convex runtime.
//
// This mirrors the algorithm used by @telegram-apps/init-data-node (its /web
// entry), implemented here with Web Crypto so it runs in Convex's default
// runtime without any Node.js APIs.

const encoder = new TextEncoder();

export interface TgUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: Uint8Array<ArrayBuffer>, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates a Telegram Mini App initData string against the bot token and
 * returns the authenticated user. Throws if the signature is invalid, the
 * data is expired, or the required fields are missing.
 */
export async function validateInitData(initData: string): Promise<TgUser> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Run `npx convex env set TELEGRAM_BOT_TOKEN <token>`.",
    );
  }

  const params = new URLSearchParams(initData);

  const hash = params.get("hash");
  if (!hash) throw new Error("Missing hash in init data");

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw) throw new Error("Missing auth_date in init data");
  const authDate = parseInt(authDateRaw, 10);
  if (Number.isNaN(authDate)) throw new Error("Invalid auth_date");
  // Reject init data older than 24 hours.
  if (Date.now() / 1000 - authDate > 86400) throw new Error("Init data expired");

  // data_check_string = sorted "key=value" pairs joined by newline
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash") return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  // secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
  const secretKey = await hmacSha256(encoder.encode("WebAppData"), token);
  // hash = hex(HMAC_SHA256(key=secret_key, data=data_check_string))
  const computed = await hmacSha256(new Uint8Array(secretKey), dataCheckString);
  const computedHex = arrayBufferToHex(computed);

  if (!safeEqual(computedHex, hash.toLowerCase())) {
    throw new Error("Invalid init data signature");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Missing user in init data");
  return JSON.parse(userRaw) as TgUser;
}
