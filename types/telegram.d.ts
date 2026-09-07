// types/telegram.d.ts
//
// Typing for `window.Telegram.WebApp`, composed from the official
// `@telegram-apps/types` package for Telegram's data shapes (User, Chat,
// ThemeParams). Only the surface this app actually uses is declared here.

import type { Chat, ThemeParams, User } from "@telegram-apps/types";

export type WebAppUser = User;
export type WebAppChat = Chat;
export type { ThemeParams };

/** Raw (snake_case) init data as exposed by `window.Telegram.WebApp.initDataUnsafe`. */
export interface WebAppInitData {
  query_id?: string;
  user?: WebAppUser;
  receiver?: WebAppUser;
  chat?: WebAppChat;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date?: number;
  hash?: string;
}

export interface WebAppHapticFeedback {
  impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  notificationOccurred(type: "error" | "success" | "warning"): void;
  selectionChanged(): void;
}

/** The subset of `window.Telegram.WebApp` used by this app. */
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: WebAppInitData;
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: ThemeParams;
  isExpanded: boolean;
  HapticFeedback: WebAppHapticFeedback;

  ready(): void;
  expand(): void;
  close(): void;
  onEvent(eventType: string, eventHandler: () => void): void;
  offEvent(eventType: string, eventHandler: () => void): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor(color: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
