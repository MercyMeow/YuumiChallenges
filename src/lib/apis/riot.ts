import { REGION_TO_ROUTE, ROUTES } from '@/lib/utils/constants';
import { isRiotRegion } from '@/lib/riot-match-id';

export {
  getRiotMatchIdValidationError,
  getRiotMatchNumberValidationError,
  MIN_RIOT_MATCH_NUMBER_LENGTH,
  normalizeRiotMatchId,
  parseRiotMatchId,
} from '@/lib/riot-match-id';
export type {
  ParsedRiotMatchId,
  RiotPlatform,
  RiotRegion,
} from '@/lib/riot-match-id';
export type RiotRoute = (typeof ROUTES)[keyof typeof ROUTES];

const VALID_ROUTES = new Set<RiotRoute>(Object.values(ROUTES));

type RiotApiErrorInit = {
  status?: number | undefined;
  retryAfterSeconds?: number | null | undefined;
  retriable?: boolean | undefined;
  code?: string | undefined;
  cause?: unknown;
};

export class RiotApiError extends Error {
  readonly status: number | undefined;
  readonly retryAfterSeconds: number | null;
  readonly retriable: boolean;
  readonly code: string | undefined;

  constructor(message: string, init: RiotApiErrorInit = {}) {
    super(message, { cause: init.cause });
    this.name = 'RiotApiError';
    this.status = init.status;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
    this.retriable = init.retriable ?? false;
    this.code = init.code;
  }

  static async fromResponse(
    response: Response,
    fallbackMessage: string
  ): Promise<RiotApiError> {
    const retryAfterSeconds = parseRetryAfterHeader(
      response.headers.get('retry-after')
    );
    const responseMessage = await readErrorMessage(response);
    const message =
      responseMessage ||
      `${fallbackMessage}: ${response.status} ${response.statusText}`;

    return new RiotApiError(message, {
      status: response.status,
      retryAfterSeconds,
      retriable: response.status === 429 || response.status >= 500,
      code: 'RIOT_HTTP_ERROR',
    });
  }
}

function parseRetryAfterHeader(headerValue: string | null): number | null {
  if (!headerValue) {
    return null;
  }

  const retryAfterSeconds = Number.parseInt(headerValue, 10);
  if (Number.isInteger(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds;
  }

  const retryAt = Date.parse(headerValue);
  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(Math.ceil((retryAt - Date.now()) / 1000), 0);
}

async function readErrorMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as {
        status?: { message?: string };
        message?: string;
      } | null;
      return payload?.status?.message ?? payload?.message ?? null;
    } catch {
      return null;
    }
  }

  try {
    const text = (await response.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

export function getRiotRoute(region: string): RiotRoute {
  if (!isRiotRegion(region)) {
    throw new RiotApiError(`Unsupported Riot region: ${region}`, {
      status: 400,
      code: 'INVALID_REGION',
    });
  }

  const route = REGION_TO_ROUTE[region];
  if (!route || !VALID_ROUTES.has(route)) {
    throw new RiotApiError(
      `No Riot routing cluster configured for region: ${region}`,
      {
        status: 400,
        code: 'INVALID_ROUTE',
      }
    );
  }

  return route;
}

export class RiotAPI {
  private apiKey: string;
  private baseUrl = 'https://{region}.api.riotgames.com';
  private routeBaseUrl = 'https://{route}.api.riotgames.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'X-Riot-Token': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private buildUrl(region: string, endpoint: string, useRoute = false) {
    if (!isRiotRegion(region)) {
      throw new RiotApiError(`Unsupported Riot region: ${region}`, {
        status: 400,
        code: 'INVALID_REGION',
      });
    }

    const route = getRiotRoute(region);
    const baseUrl = useRoute
      ? this.routeBaseUrl.replace('{route}', route)
      : this.baseUrl.replace('{region}', region);

    return `${baseUrl}${endpoint}`;
  }

  private async request<T>(
    region: string,
    endpoint: string,
    fallbackMessage: string,
    useRoute = false
  ): Promise<T> {
    const url = this.buildUrl(region, endpoint, useRoute);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw await RiotApiError.fromResponse(response, fallbackMessage);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RiotApiError) {
        throw error;
      }

      throw new RiotApiError(fallbackMessage, {
        retriable: true,
        code: error instanceof Error ? error.name : 'UNKNOWN_RIOT_ERROR',
        cause: error,
      });
    }
  }

  async getSummonerByRiotId(gameName: string, tagLine: string, region: string) {
    const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch account from Riot API',
      true
    );
  }

  async getSummonerByPuuid(puuid: string, region: string) {
    const endpoint = `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch summoner from Riot API'
    );
  }

  async getMatchHistory(puuid: string, region: string, count = 20) {
    const endpoint = `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch match history from Riot API',
      true
    );
  }

  async getMatchDetails(matchId: string, region: string) {
    const endpoint = `/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch match details from Riot API',
      true
    );
  }

  async getMatchTimeline(matchId: string, region: string) {
    const endpoint = `/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch match timeline from Riot API',
      true
    );
  }

  async getRankedInfo(summonerId: string, region: string) {
    const endpoint = `/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch ranked info from Riot API'
    );
  }

  async getRankedInfoByPuuid(puuid: string, region: string) {
    const endpoint = `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    return this.request(
      region,
      endpoint,
      'Failed to fetch ranked info by PUUID from Riot API'
    );
  }

  async getAccountByRiotId(gameName: string, tagLine: string, region: string) {
    // This is an alias for getSummonerByRiotId for consistency
    return this.getSummonerByRiotId(gameName, tagLine, region);
  }

  async refreshSummonerData(puuid: string, region: string) {
    // Refreshes summoner data to get latest profile icon and other info
    return this.getSummonerByPuuid(puuid, region);
  }
}
