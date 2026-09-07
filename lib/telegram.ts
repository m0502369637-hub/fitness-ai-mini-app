import { TelegramWebApp } from "@/types/telegram";

export function getInitData(webApp: TelegramWebApp | null): string {
  return webApp?.initData ?? "";
}

export function formatPoints(n: number): string {
  return n.toLocaleString();
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
