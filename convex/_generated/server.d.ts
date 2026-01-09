/* eslint-disable */
/**
 * Generated server types - will be replaced by actual types when connected to Convex
 */

import {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  actionGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define a query in this Convex app's public API.
 */
export declare const query: typeof queryGeneric;

/**
 * Define a mutation in this Convex app's public API.
 */
export declare const mutation: typeof mutationGeneric;

/**
 * Define an action in this Convex app's public API.
 */
export declare const action: typeof actionGeneric;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
