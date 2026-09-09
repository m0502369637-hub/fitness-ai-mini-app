// convex/marketing/crons.ts
//
// The Marketing Engine heartbeat. Content drops three times a week —
// Tuesday, Thursday and Saturday — and Convex cron schedules run in UTC, so
// the times below are Riyadh (UTC+3) converted:
//
//   18:00 Riyadh (15:00 UTC)  generateCampaign   (captions -> image -> fal.ai workflow video)
//   19:00 Riyadh (16:00 UTC)  runDistribution    (Composio external + Telegram broadcast)
//   24:00 Riyadh (21:00 UTC)  cleanupOldAssets   (delete storage files of campaigns completed >24h ago)
//
// Convex has no weekday filter, so generate/distribute still fire daily but
// pass `respectSchedule: true`; the actions check the marketing-day calendar
// (convex/marketing/schedule.ts) and no-op on every other day. Cleanup is pure
// storage hygiene and keeps running daily.
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
  { respectSchedule: true },
);

crons.daily(
  "marketing-cleanup-assets",
  { hourUTC: 21, minuteUTC: 0 },
  api.marketing.cleaner.cleanupOldAssets,
  {},
);

export default crons;
