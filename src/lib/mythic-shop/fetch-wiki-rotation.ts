/**
 * Fetches the raw wikitext of the League Wiki "Mythic Shop Rotation" article
 * via the Fandom MediaWiki `parse` API.
 *
 * Wikitext is used (rather than rendered HTML or plaintext extracts, which the
 * wiki does not support) because each shop entry is a structured
 * `{{Mythic_Shop_Rotation}}` template that is straightforward to parse.
 */

import { z } from 'zod';

export const WIKI_PAGE_TITLE = 'Mythic Shop Rotation';
export const WIKI_SOURCE_NAME = 'League of Legends Wiki';
export const WIKI_SOURCE_URL =
  'https://leagueoflegends.fandom.com/wiki/Mythic_Shop_Rotation';

const WIKI_API_URL =
  'https://leagueoflegends.fandom.com/api.php' +
  '?action=parse&prop=wikitext&format=json&redirects=1' +
  `&page=${encodeURIComponent(WIKI_PAGE_TITLE)}`;

const FETCH_TIMEOUT_MS = 10_000;

const wikiResponseSchema = z.object({
  parse: z.object({
    wikitext: z.object({
      '*': z.string(),
    }),
  }),
});

/**
 * Fetches the Mythic Shop Rotation wikitext from the wiki.
 *
 * @throws when the request times out, fails, or returns no usable wikitext.
 */
export async function fetchWikiRotationWikitext(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(WIKI_API_URL, {
      headers: { 'User-Agent': 'YuumiChallenges/1.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Mythic Shop wiki request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Mythic Shop wiki request failed: ${response.status}`);
  }

  const json = await response.json();
  const parsed = wikiResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Unexpected Mythic Shop wiki response shape');
  }

  return parsed.data.parse.wikitext['*'];
}
