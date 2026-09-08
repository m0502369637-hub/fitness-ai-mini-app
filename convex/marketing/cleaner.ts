// convex/marketing/cleaner.ts
//
// Storage management for the Marketing Engine. Runs 24 hours after a campaign
// is "completed" (see crons.ts — 23:00 daily sweep):
//
//   1. Finds completed campaigns with completedAt <= now - 24h.
//   2. Reads their marketingAssets rows to get the image/video storageIds.
//   3. Calls ctx.storage.delete(storageId) to free the Convex storage quota.
//   4. Marks the asset rows deleted and writes the outcome to marketing_logs.
//
// Failed campaigns (generation broke) are swept after 48h so partially
// generated files can't leak storage forever. This housekeeping job is NOT
// gated by MARKETING_ENABLED — it is safe (and desirable) to run it always.
//
// Note: after cleanup, a completed campaign's imageUrl/videoUrl are dead links
// by design; the campaign keeps its captions and stats for the audit trail.

import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

type CleanupResult = {
  ok: boolean;
  campaigns: number;
  deleted: number;
  errors: string[];
};

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const cleanupOldAssets = action({
  args: {},
  handler: async (ctx): Promise<CleanupResult> => {
    const cutoffMs = Date.now() - CLEANUP_AFTER_MS;
    const candidates = await ctx.runQuery(internal.marketing.internals.listCleanupCandidates, {
      cutoffMs,
    });

    let deleted = 0;
    const errors: string[] = [];

    for (const campaign of candidates) {
      const assets = await ctx.runQuery(internal.marketing.internals.listUndeletedAssets, {
        campaignId: campaign._id,
      });
      let campaignDeleted = 0;

      for (const asset of assets) {
        try {
          await ctx.storage.delete(asset.storageId);
          await ctx.runMutation(internal.marketing.internals.markAssetDeleted, { assetId: asset._id });
          deleted++;
          campaignDeleted++;
        } catch (e) {
          // Leave the row unmarked so the next nightly sweep retries the delete.
          errors.push(`${asset.kind}/${asset.storageId}: ${errMsg(e)}`);
        }
      }

      await ctx.runMutation(internal.marketing.internals.log, {
        campaignId: campaign._id,
        level: campaignDeleted < assets.length ? "warn" : "info",
        source: "cleaner",
        message:
          assets.length === 0
            ? `Cleanup: campaign "${campaign.theme}" has no active assets`
            : `Cleanup: deleted ${campaignDeleted}/${assets.length} stored files for "${campaign.theme}"`,
      });
    }

    return { ok: true, campaigns: candidates.length, deleted, errors };
  },
});
