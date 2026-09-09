// convex/marketing/schedule.ts
//
// Marketing-day calendar. Content drops three times a week — Tuesday, Thursday
// and Saturday (Riyadh time, UTC+3). Convex's cron scheduler has no weekday
// filter, so the cron entries still fire daily and the scheduled actions check
// this guard. Only cron-triggered runs pass `respectSchedule: true`; manual
// `npx convex run` invocations ignore the calendar and run any day.

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3
const MARKETING_DAYS = new Set([2, 4, 6]); // Tue, Thu, Sat (getUTCDay(): 0=Sun)

/** True when the given epoch-ms instant falls on a marketing day in Riyadh. */
export function isMarketingDay(nowMs: number = Date.now()): boolean {
  return MARKETING_DAYS.has(new Date(nowMs + RIYADH_OFFSET_MS).getUTCDay());
}

export const MARKETING_DAYS_LABEL = "Tuesday, Thursday, Saturday (Riyadh, UTC+3)";
