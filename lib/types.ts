// Shared app-level types. These intentionally mirror the Convex document shapes
// so the demo (in-memory) and real (Convex) data providers can share one interface.

export type TransactionType = "welcome" | "purchase" | "use_ai" | "use_plan" | "refund";

export interface AppUser {
  _id: string;
  tgId: string;
  name: string;
  username?: string;
  pointsBalance: number;
  createdAt: number;
  onboarded?: boolean;
  language?: string;
}

/** Structured onboarding questionnaire answers. */
export interface AppUserProfile {
  _id: string;
  userId: string;
  goal: string;
  level: string;
  experience: string;
  weeklyDays: number;
  equipment: string[];
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  age?: number;
  gender?: string;
  limitations?: string;
  diet?: string;
  updatedAt: number;
}

/** Payload for saving the onboarding questionnaire. */
export interface ProfileAnswers {
  goal: string;
  level: string;
  experience: string;
  weeklyDays: number;
  equipment: string[];
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  age?: number;
  gender?: string;
  limitations?: string;
  diet?: string;
}

export interface AppCoachMessage {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageStorageId?: string;
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
  exerciseId?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  level?: string;
  images?: string[];
  instructions?: string[];
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
  durationWeeks?: number;
  days: AppPlanDay[];
  createdAt: number;
}

export interface GeneratedPlan {
  _id: string;
  title: string;
  durationWeeks?: number;
  days: AppPlanDay[];
}

export interface AppExerciseLog {
  _id: string;
  userId: string;
  planId: string;
  dayIndex: number;
  exerciseIndex: number;
  exerciseId?: string;
  completed: boolean;
  completedAt: number;
}

export interface ProgressStats {
  today: number;
  week: number;
  month: number;
  all: number;
}

export interface ToggleExerciseArgs {
  planId: string;
  dayIndex: number;
  exerciseIndex: number;
  exerciseId?: string;
  completed: boolean;
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
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number }
  | { ok: false; reason: "LLM_NOT_CONFIGURED"; balance: number; required: number }
  | { ok: false; reason: "VISION_NOT_CONFIGURED"; balance: number; required: number };

export type ImageAnalysisResult =
  | { ok: true; balance: number; response: string }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number }
  | { ok: false; reason: "VISION_NOT_CONFIGURED"; balance: number; required: number };

/** A single structured plan change, produced by the AI and approved by the user. */
export type PlanEditOperation =
  | { type: 'update'; dayIndex: number; exerciseIndex: number; sets?: number; reps?: string }
  | { type: 'replace'; dayIndex: number; exerciseIndex: number; name: string; exerciseId?: string; sets?: number; reps?: string }
  | { type: 'add'; dayIndex: number; name: string; exerciseId?: string; sets?: number; reps?: string }
  | { type: 'remove'; dayIndex: number; exerciseIndex: number };

export interface PlanEditProposal {
  summary: string;
  operations: PlanEditOperation[];
}

export type PlanEditResult =
  | { ok: true; balance: number; planId: string; proposal: PlanEditProposal }
  | {
      ok: false;
      reason: 'INSUFFICIENT_POINTS' | 'LLM_NOT_CONFIGURED' | 'NO_PLAN' | 'INVALID_PROPOSAL';
      balance: number;
      required: number;
    };

export type PlanResult =
  | { ok: true; balance: number; plan: GeneratedPlan }
  | { ok: false; reason: "INSUFFICIENT_POINTS"; balance: number; required: number };

export interface AppData {
  isDemo: boolean;
  ready: boolean;
  userId: string | null;
  isNewUser: boolean;
  user: AppUser | null;
  profile: AppUserProfile | null;
  transactions: AppTransaction[];
  plans: AppPlan[];
  packages: AppPackage[];
  exerciseLogs: AppExerciseLog[];
  coachMessages: AppCoachMessage[];
  progress: ProgressStats;
  askCoach: (message: string) => Promise<CoachResult>;
  analyzeBodyImage: (storageId: string, note?: string) => Promise<ImageAnalysisResult>;
  uploadImage: (file: File) => Promise<string | null>;
  proposePlanEdit: (request: string) => Promise<PlanEditResult>;
  applyPlanEdit: (planId: string, operations: PlanEditOperation[]) => Promise<void>;
  submitFeatureRequest: (title: string, description: string, contact?: string) => Promise<void>;
  saveProfile: (answers: ProfileAnswers, language?: string) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  generatePlan: (goal: string, level: string) => Promise<PlanResult>;
  buyPackage: (pkg: AppPackage) => Promise<void>;
  toggleExercise: (args: ToggleExerciseArgs) => Promise<void>;
}
