import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { resolveOrCreateUser } from "./lib/users";

// These mutations are called by the Next.js API routes (server-to-server), not
// by the browser. They are protected with a shared secret so an attacker who
// knows the public CONVEX_URL cannot credit themselves points.

function assertApiSecret(secret: string) {
  const expected = process.env.API_SECRET;
  if (!expected) {
    throw new Error("API_SECRET is not set. Run `npx convex env set API_SECRET <value>`.");
  }
  if (secret !== expected) throw new Error("Unauthorized");
}

/** Read a pending payment by its invoice payload (used by the webhook). */
export const getPending = query({
  args: { payload: v.string() },
  handler: async (ctx, { payload }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_payload", (q) => q.eq("payload", payload))
      .first();
  },
});

/**
 * Creates a pending payment for an invoice. Returns the package pricing the
 * Next.js route needs to build the Telegram invoice (server-side source of truth).
 */
export const createPending = mutation({
  args: {
    secret: v.string(),
    tgId: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    packageKey: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.secret);

    const pkg = await ctx.db
      .query("pointPackages")
      .withIndex("by_key", (q) => q.eq("key", args.packageKey))
      .first();
    if (!pkg || !pkg.active) throw new Error("Unknown or inactive package");

    // Ensure the user exists (also handles the welcome bonus if brand new).
    const { userId } = await resolveOrCreateUser(ctx.db, args.tgId, args.name, args.username);

    await ctx.db.insert("payments", {
      payload: args.payload,
      userId,
      packageKey: args.packageKey,
      points: pkg.points,
      stars: pkg.stars,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      stars: pkg.stars,
      points: pkg.points,
      title: pkg.title,
      description: pkg.description,
    };
  },
});

/**
 * Credits points after Telegram confirms a successful payment.
 * Idempotent — keyed on telegramPaymentChargeId so a duplicate webhook delivery
 * can never double-credit.
 */
export const completePayment = mutation({
  args: {
    secret: v.string(),
    payload: v.string(),
    telegramPaymentChargeId: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.secret);

    if (args.currency !== "XTR") throw new Error("Unexpected currency");

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_payload", (q) => q.eq("payload", args.payload))
      .first();
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "pending") {
      return { ok: true as const, alreadyProcessed: true as const };
    }
    if (payment.stars !== args.totalAmount) throw new Error("Amount mismatch");

    // Idempotency guard: never credit the same Telegram charge twice.
    const alreadyCredited = await ctx.db
      .query("transactions")
      .withIndex("by_chargeId", (q) => q.eq("telegramPaymentChargeId", args.telegramPaymentChargeId))
      .first();

    await ctx.db.patch(payment._id, {
      status: "completed",
      telegramPaymentChargeId: args.telegramPaymentChargeId,
      completedAt: Date.now(),
    });

    if (alreadyCredited) {
      return { ok: true as const, alreadyProcessed: true as const };
    }

    const user = await ctx.db.get(payment.userId);
    if (!user) throw new Error("User not found");

    const newBalance = user.pointsBalance + payment.points;
    await ctx.db.patch(user._id, { pointsBalance: newBalance });
    await ctx.db.insert("transactions", {
      userId: user._id,
      amount: payment.points,
      type: "purchase",
      description: `+${payment.points} Purchased`,
      pointsAfter: newBalance,
      timestamp: Date.now(),
      telegramPaymentChargeId: args.telegramPaymentChargeId,
    });

    return { ok: true as const, balance: newBalance };
  },
});
