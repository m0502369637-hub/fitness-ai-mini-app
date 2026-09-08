// convex/feedback.ts
// Feature requests submitted from the Profile page.

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { validateInitData } from "./lib/telegram";

export const submit = mutation({
  args: {
    initData: v.string(),
    title: v.string(),
    description: v.string(),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tgUser = await validateInitData(args.initData);
    const user = await ctx.db
      .query("users")
      .withIndex("by_tgId", (q) => q.eq("tgId", String(tgUser.id)))
      .first();
    if (!user) throw new Error("User not found");

    const title = args.title.trim();
    const description = args.description.trim();
    if (!title || !description) throw new Error("Title and description are required");

    await ctx.db.insert("featureRequests", {
      userId: user._id,
      title,
      description,
      contact: args.contact?.trim() || undefined,
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
