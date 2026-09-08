/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as coach from "../coach.js";
import type * as coachInternal from "../coachInternal.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_exercises from "../lib/exercises.js";
import type * as lib_mock from "../lib/mock.js";
import type * as lib_models from "../lib/models.js";
import type * as lib_prompts from "../lib/prompts.js";
import type * as lib_telegram from "../lib/telegram.js";
import type * as lib_users from "../lib/users.js";
import type * as marketing_cleaner from "../marketing/cleaner.js";
import type * as marketing_crons from "../marketing/crons.js";
import type * as marketing_distributor from "../marketing/distributor.js";
import type * as marketing_generator from "../marketing/generator.js";
import type * as marketing_internals from "../marketing/internals.js";
import type * as packages from "../packages.js";
import type * as payments from "../payments.js";
import type * as points from "../points.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as workoutLogs from "../workoutLogs.js";
import type * as workoutPlans from "../workoutPlans.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  coach: typeof coach;
  coachInternal: typeof coachInternal;
  crons: typeof crons;
  feedback: typeof feedback;
  "lib/constants": typeof lib_constants;
  "lib/exercises": typeof lib_exercises;
  "lib/mock": typeof lib_mock;
  "lib/models": typeof lib_models;
  "lib/prompts": typeof lib_prompts;
  "lib/telegram": typeof lib_telegram;
  "lib/users": typeof lib_users;
  "marketing/cleaner": typeof marketing_cleaner;
  "marketing/crons": typeof marketing_crons;
  "marketing/distributor": typeof marketing_distributor;
  "marketing/generator": typeof marketing_generator;
  "marketing/internals": typeof marketing_internals;
  packages: typeof packages;
  payments: typeof payments;
  points: typeof points;
  transactions: typeof transactions;
  users: typeof users;
  workoutLogs: typeof workoutLogs;
  workoutPlans: typeof workoutPlans;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
