/* eslint-disable */
/**
 * Generated API types - will be replaced by actual types when connected to Convex
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as auth from "../auth.js";
import type * as guide from "../guide.js";
import type * as scraper from "../scraper.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  guide: typeof guide;
  scraper: typeof scraper;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
