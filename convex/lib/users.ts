import { Doc } from "../_generated/dataModel";
import { DatabaseWriter } from "../_generated/server";
import { WELCOME_POINTS } from "./constants";

/**
 * Idempotently resolves (or creates) a user and, on first creation, credits
 * the welcome bonus atomically with its ledger entry.
 */
export async function resolveOrCreateUser(
  db: DatabaseWriter,
  tgId: string,
  name: string,
  username?: string,
): Promise<{ userId: Doc<"users">["_id"]; isNew: boolean; user: Doc<"users"> }> {
  const existing = await db
    .query("users")
    .withIndex("by_tgId", (q) => q.eq("tgId", tgId))
    .first();

  if (existing) {
    return { userId: existing._id, isNew: false, user: existing };
  }

  const userId = await db.insert("users", {
    tgId,
    name,
    username,
    pointsBalance: WELCOME_POINTS,
    createdAt: Date.now(),
    onboarded: false,
  });

  await db.insert("transactions", {
    userId,
    amount: WELCOME_POINTS,
    type: "welcome",
    description: `+${WELCOME_POINTS} Welcome Reward`,
    pointsAfter: WELCOME_POINTS,
    timestamp: Date.now(),
  });

  const user = await db.get(userId);
  if (!user) throw new Error("Failed to create user");

  return { userId, isNew: true, user };
}
