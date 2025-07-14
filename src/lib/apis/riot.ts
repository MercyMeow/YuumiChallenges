import { REGION_TO_ROUTE } from '@/lib/utils/constants';

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
    const route = REGION_TO_ROUTE[region as keyof typeof REGION_TO_ROUTE];
    const baseUrl = useRoute 
      ? this.routeBaseUrl.replace('{route}', route)
      : this.baseUrl.replace('{region}', region);
    
    return `${baseUrl}${endpoint}`;
  }

  async getSummonerByRiotId(gameName: string, tagLine: string, region: string) {
    const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const url = this.buildUrl(region, endpoint, true);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }

    return response.json();
  }

  async getSummonerByPuuid(puuid: string, region: string) {
    const endpoint = `/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const url = this.buildUrl(region, endpoint);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch summoner: ${response.statusText}`);
    }

    return response.json();
  }

  async getMatchHistory(puuid: string, region: string, count = 20) {
    const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
    const url = this.buildUrl(region, endpoint, true);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch match history: ${response.statusText}`);
    }

    return response.json();
  }

  async getMatchDetails(matchId: string, region: string) {
    const endpoint = `/lol/match/v5/matches/${matchId}`;
    const url = this.buildUrl(region, endpoint, true);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch match details: ${response.statusText}`);
    }

    return response.json();
  }

  async getRankedInfo(summonerId: string, region: string) {
    const endpoint = `/lol/league/v4/entries/by-summoner/${summonerId}`;
    const url = this.buildUrl(region, endpoint);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ranked info: ${response.statusText}`);
    }

    return response.json();
  }

  async getAccountByRiotId(gameName: string, tagLine: string, region: string) {
    // This is an alias for getSummonerByRiotId for consistency
    return this.getSummonerByRiotId(gameName, tagLine, region);
  }

  async getItemSets() {
    // Item sets are not available in the current Riot API
    // Return empty array as a placeholder
    return [];
  }
}