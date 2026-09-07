/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_constants from "../lib/constants.js";
import type * as lib_mock from "../lib/mock.js";
import type * as lib_telegram from "../lib/telegram.js";
import type * as lib_users from "../lib/users.js";
import type * as packages from "../packages.js";
import type * as payments from "../payments.js";
import type * as points from "../points.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as workoutPlans from "../workoutPlans.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/constants": typeof lib_constants;
  "lib/mock": typeof lib_mock;
  "lib/telegram": typeof lib_telegram;
  "lib/users": typeof lib_users;
  packages: typeof packages;
  payments: typeof payments;
  points: typeof points;
  transactions: typeof transactions;
  users: typeof users;
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
