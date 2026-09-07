// Shared app-level types. These intentionally mirror the Convex document shapes
// so the demo (in-memory) and real (Convex) data providers can share one interface.

export type TransactionType = "welcome" | "purchase" | "use_ai" | "use_plan";

export interface AppUser {
  _id: string;
  tgId: string;
  name: string;
  username?: string;
  pointsBalance: number;
  createdAt: number;
}

export interface AppTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  pointsAfter: number;
  timestamp: number;
  telegramPaymentChargeId?: string;
}

export interface AppExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface AppPlanDay {
  day: string;
  exercises: AppExercise[];
}

export interface AppPlan {
  _id: string;
  userId: string;
  title: string;
  goal?: string;
  level?: string;
  days: AppPlanDay[];
  createdAt: number;
}

export interface GeneratedPlan {
  _id: string;
  title: string;
  days: AppPlanDay[];
}

export interface AppPackage {
  _id: string;
  key: string;
  title: string;
  description: string;
  points: number;
  stars: number;
  active: boolean;
}

export type CoachResult =
  | { ok: true; balance: number; response: string }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number };

export type PlanResult =
  | { ok: true; balance: number; plan: GeneratedPlan }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number };

export interface AppData {
  isDemo: boolean;
  ready: boolean;
  userId: string | null;
  isNewUser: boolean;
  user: AppUser | null;
  transactions: AppTransaction[];
  plans: AppPlan[];
  packages: AppPackage[];
  askCoach: (message: string) => Promise<CoachResult>;
  generatePlan: (goal: string, level: string) => Promise<PlanResult>;
  buyPackage: (pkg: AppPackage) => Promise<void>;
}
