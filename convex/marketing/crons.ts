// convex/marketing/crons.ts
//
// The Marketing Engine heartbeat. Convex cron schedules run in UTC — the times
// below are Riyadh (UTC+3) converted:
//
//   18:00 Riyadh (15:00 UTC)  generateCampaign   (captions -> image -> fal.ai workflow video)
//   19:00 Riyadh (16:00 UTC)  runDistribution    (Composio external + Telegram broadcast)
//   24:00 Riyadh (21:00 UTC)  cleanupOldAssets   (delete storage files of campaigns completed >24h ago)
//
// Money-saving split:
//   - GENERATION costs money (HF + fal.ai credits) → only Tue/Thu/Sat. Convex
//     has no weekday filter, so the cron fires daily and the action checks the
//     marketing-day calendar (convex/marketing/schedule.ts) and no-ops on
//     other days.
//   - DISTRIBUTION is free (Composio + Telegram) → every day. On days without
//     a fresh campaign the distributor repurposes the latest completed one:
//     same image/video, platform-native captions with a rotating Arabic hook
//     prefix so consecutive posts differ.
// Cleanup is pure storage hygiene and keeps running daily.
//
// Convex looks for the crons export in convex/crons.ts (repo root), so the
// root file simply re-exports this module.
//
// Every job is gated by MARKETING_ENABLED === "true" (except the safe cleanup
// sweep), so deploying this file changes nothing until the env var is set.

import { cronJobs } from "convex/server";
import { api } from "../_generated/api";

const crons = cronJobs();

crons.daily(
  "marketing-generate-campaign",
  { hourUTC: 15, minuteUTC: 0 },
  api.marketing.generator.generateCampaign,
  { respectSchedule: true },
);

crons.daily(
  "marketing-distribute-campaign",
  { hourUTC: 16, minuteUTC: 0 },
  api.marketing.distributor.runDistribution,
  { repurpose: true },
);

crons.daily(
  "marketing-cleanup-assets",
  { hourUTC: 21, minuteUTC: 0 },
  api.marketing.cleaner.cleanupOldAssets,
  {},
);

export default crons;
