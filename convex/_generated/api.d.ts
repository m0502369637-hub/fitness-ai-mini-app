/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED. To regenerate, run `npx convex dev`.
 *
 * @module
 */

import type { ApiFromModules } from "convex/server";
import type * as packages from "../packages.js";
import type * as payments from "../payments.js";
import type * as points from "../points.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as workoutPlans from "../workoutPlans.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: ApiFromModules<{
  packages: typeof packages;
  payments: typeof payments;
  points: typeof points;
  transactions: typeof transactions;
  users: typeof users;
  workoutPlans: typeof workoutPlans;
}>;
