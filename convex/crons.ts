// convex/crons.ts
//
// Convex requires the cron configuration to live at the repo root as
// convex/crons.ts. The Marketing Engine keeps its schedules self-contained in
// convex/marketing/crons.ts — this file just re-exports them.

import marketingCrons from "./marketing/crons";

export default marketingCrons;
