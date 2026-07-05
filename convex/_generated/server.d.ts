/* eslint-disable */
/**
 * Generated server types - will be replaced by actual types when connected to Convex
 */

import {
  ActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from 'convex/server';
import type { DataModel } from './dataModel.js';

/**
 * Define a query in this Convex app's public API.
 */
export declare const query: QueryBuilder<DataModel, 'public'>;

/**
 * Define a mutation in this Convex app's public API.
 */
export declare const mutation: MutationBuilder<DataModel, 'public'>;

/**
 * Define an action in this Convex app's public API.
 */
export declare const action: ActionBuilder<DataModel, 'public'>;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
export type DatabaseReader = GenericDatabaseReader<DataModel>;
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;
