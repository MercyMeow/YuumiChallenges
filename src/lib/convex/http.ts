// Fail-soft Convex reads for public pages and server contexts (metadata, OG
// images) that must not depend on the React provider. Any missing config or
// network/parse error yields null/undefined so callers fall back to static
// data instead of throwing.

import { ConvexHttpClient } from 'convex/browser';
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from 'convex/server';
import { api } from '../../../convex/_generated/api';

/** Runs a Convex query with a fresh HTTP client; null if Convex is unconfigured or unreachable. */
export async function queryConvex<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgs<Query>
): Promise<FunctionReturnType<Query> | null> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  try {
    return await new ConvexHttpClient(url).query(query, ...args);
  } catch {
    return null;
  }
}

/** Reads a single `guideMetadata` value by key; undefined when absent or unreachable. */
export async function fetchMetadataValue(
  key: string
): Promise<string | undefined> {
  const metadata = await queryConvex(api.guide.getMetadata, {});
  return metadata?.[key];
}
