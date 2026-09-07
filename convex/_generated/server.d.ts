/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation
 * functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED. To regenerate, run `npx convex dev`.
 *
 * @module
 */

import {
  ActionBuilder,
  HttpActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define a query in this Convex app's public API.
 */
export declare const query: QueryBuilder<DataModel, "public">;

/**
 * Define a mutation in this Convex app's public API.
 */
export declare const mutation: MutationBuilder<DataModel, "public">;

/**
 * Define an action in this Convex app's public API.
 */
export declare const action: ActionBuilder<DataModel, "public">;

/**
 * Define an internal query in this Convex app's public API.
 */
export declare const internalQuery: QueryBuilder<DataModel, "internal">;

/**
 * Define an internal mutation in this Convex app's public API.
 */
export declare const internalMutation: MutationBuilder<DataModel, "internal">;

/**
 * Define an internal action in this Convex app's public API.
 */
export declare const internalAction: ActionBuilder<DataModel, "internal">;

/**
 * Define an HTTP action in this Convex app's public API.
 */
export declare const httpAction: HttpActionBuilder;

/**
 * Context passed to a query function.
 */
export type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * Context passed to a mutation function.
 */
export type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Context passed to an action function.
 */
export type ActionCtx = GenericActionCtx<DataModel>;

/**
 * A read-only database, used by queries.
 */
export type DatabaseReader = GenericDatabaseReader<DataModel>;

/**
 * A read-write database, used by mutations.
 */
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;
