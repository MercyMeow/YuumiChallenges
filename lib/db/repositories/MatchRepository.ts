import { Filter } from 'mongodb';
import { BaseRepository } from './BaseRepository';
import { Match, MatchCollection } from '@/models/Match';

/**
 * Repository for Match collection
 */
export class MatchRepository extends BaseRepository<Match> {
  constructor() {
    super(MatchCollection);
  }

  /**
   * Find a match by Riot match ID
   */
  async findByMatchId(matchId: string): Promise<Match | null> {
    return this.findOne({ matchId } as Filter<Match>);
  }

  /**
   * Find matches by summoner PUUID
   */
  async findBySummonerPuuid(puuid: string, limit: number = 10): Promise<Match[]> {
    return this.find(
      { 'participants.puuid': puuid } as Filter<Match>,
      { limit, sort: { gameCreation: -1 } }
    );
  }

  /**
   * Find matches by champion ID
   */
  async findByChampionId(championId: number): Promise<Match[]> {
    return this.find({ 'participants.championId': championId } as Filter<Match>);
  }

  /**
   * Find matches by game mode
   */
  async findByGameMode(gameMode: string): Promise<Match[]> {
    return this.find({ gameMode } as Filter<Match>);
  }

  /**
   * Find matches by platform ID (region)
   */
  async findByPlatformId(platformId: string): Promise<Match[]> {
    return this.find({ platformId } as Filter<Match>);
  }

  /**
   * Find matches within a time range
   */
  async findByTimeRange(startTime: number, endTime: number): Promise<Match[]> {
    return this.find({
      gameCreation: {
        $gte: startTime,
        $lte: endTime
      }
    } as Filter<Match>);
  }

  /**
   * Find matches where a summoner played a specific champion
   */
  async findBySummonerAndChampion(puuid: string, championId: number): Promise<Match[]> {
    return this.find({
      'participants.puuid': puuid,
      'participants.championId': championId
    } as Filter<Match>);
  }

  /**
   * Find matches where a summoner won
   */
  async findWinsByPuuid(puuid: string): Promise<Match[]> {
    return this.find({
      'participants': {
        $elemMatch: {
          puuid: puuid,
          win: true
        }
      }
    } as Filter<Match>);
  }

  /**
   * Check if a match already exists in the database
   */
  async exists(matchId: string): Promise<boolean> {
    const count = await this.count({ matchId } as Filter<Match>);
    return count > 0;
  }

  /**
   * Get match statistics for a summoner
   */
  async getSummonerStats(puuid: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    averageKDA: { kills: number; deaths: number; assists: number };
  }> {
    await this.initialize();
    
    const matches = await this.find({ 'participants.puuid': puuid } as Filter<Match>);
    
    let totalGames = 0;
    let wins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    
    matches.forEach(match => {
      const participant = match.participants.find(p => p.puuid === puuid);
      if (participant) {
        totalGames++;
        if (participant.win) wins++;
        totalKills += participant.kills;
        totalDeaths += participant.deaths;
        totalAssists += participant.assists;
      }
    });
    
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    
    return {
      totalGames,
      wins,
      losses,
      winRate,
      averageKDA: {
        kills: totalGames > 0 ? totalKills / totalGames : 0,
        deaths: totalGames > 0 ? totalDeaths / totalGames : 0,
        assists: totalGames > 0 ? totalAssists / totalGames : 0
      }
    };
  }
}
