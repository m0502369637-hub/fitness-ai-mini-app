// convex/marketing/crons.ts
//
// The Marketing Engine heartbeat. Convex cron schedules run in UTC — convert
// your local time: e.g. 08:00 in Riyadh (UTC+3) is hourUTC: 5.
//
//   08:00  generateCampaign   (HF: captions -> image -> video, save to storage)
//   10:00  runDistribution    (Composio external posts + Telegram user broadcast)
//   23:00  cleanupOldAssets   (delete storage files of campaigns completed >24h ago)
//
// Convex looks for the crons export in convex/crons.ts (repo root), so the
// root file simply re-exports this module. Tip from the Convex docs: avoid the
// exact top of the hour (minute 0) when you can — here we keep minute 0 as
// specified, but any minute value works.
//
// Every job is gated by MARKETING_ENABLED === "true" (except the safe cleanup
// sweep), so deploying this file changes nothing until the env var is set.

import { cronJobs } from "convex/server";
import { api } from "../_generated/api";

const crons = cronJobs();

crons.daily(
  "marketing-generate-campaign",
  { hourUTC: 8, minuteUTC: 0 },
  api.marketing.generator.generateCampaign,
  {},
);

crons.daily(
  "marketing-distribute-campaign",
  { hourUTC: 10, minuteUTC: 0 },
  api.marketing.distributor.runDistribution,
  {},
);

crons.daily(
  "marketing-cleanup-assets",
  { hourUTC: 23, minuteUTC: 0 },
  api.marketing.cleaner.cleanupOldAssets,
  {},
);

export default crons;
