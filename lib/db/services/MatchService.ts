import { matchRepository } from '../repositories';
import { Match, matchHelpers } from '@/models/Match';
import { ApiError } from '@/types';

/**
 * Service for match-related operations
 */
export class MatchService {
  /**
   * Get a match by ID
   */
  async getMatchById(id: string): Promise<Match> {
    try {
      const match = await matchRepository.findById(id);
      if (!match) {
        throw new ApiError('Match not found', 'MATCH_NOT_FOUND', 404);
      }
      return match;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get match', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get a match by Riot match ID
   */
  async getMatchByMatchId(matchId: string): Promise<Match> {
    try {
      const match = await matchRepository.findByMatchId(matchId);
      if (!match) {
        throw new ApiError('Match not found', 'MATCH_NOT_FOUND', 404);
      }
      return match;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get match', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Save a match from Riot API data
   */
  async saveMatch(riotMatchData: any): Promise<Match> {
    try {
      // Check if match already exists
      const matchId = riotMatchData.metadata.matchId;
      const existingMatch = await matchRepository.findByMatchId(matchId);
      
      if (existingMatch) {
        return existingMatch;
      }
      
      // Create new match
      const matchData = matchHelpers.createMatchFromRiotData(riotMatchData);
      return await matchRepository.create(matchData);
    } catch (error) {
      throw new ApiError('Failed to save match', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get matches by summoner PUUID
   */
  async getMatchesBySummoner(puuid: string, limit: number = 10): Promise<Match[]> {
    try {
      return await matchRepository.findBySummonerPuuid(puuid, limit);
    } catch (error) {
      throw new ApiError('Failed to get matches', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get matches by champion ID
   */
  async getMatchesByChampion(championId: number): Promise<Match[]> {
    try {
      return await matchRepository.findByChampionId(championId);
    } catch (error) {
      throw new ApiError('Failed to get matches', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get matches by game mode
   */
  async getMatchesByGameMode(gameMode: string): Promise<Match[]> {
    try {
      return await matchRepository.findByGameMode(gameMode);
    } catch (error) {
      throw new ApiError('Failed to get matches', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get matches where a summoner played a specific champion
   */
  async getMatchesBySummonerAndChampion(puuid: string, championId: number): Promise<Match[]> {
    try {
      return await matchRepository.findBySummonerAndChampion(puuid, championId);
    } catch (error) {
      throw new ApiError('Failed to get matches', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get summoner statistics
   */
  async getSummonerStats(puuid: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    averageKDA: { kills: number; deaths: number; assists: number };
  }> {
    try {
      return await matchRepository.getSummonerStats(puuid);
    } catch (error) {
      throw new ApiError('Failed to get summoner stats', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Check if a match exists
   */
  async matchExists(matchId: string): Promise<boolean> {
    try {
      return await matchRepository.exists(matchId);
    } catch (error) {
      throw new ApiError('Failed to check match existence', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Delete a match
   */
  async deleteMatch(id: string): Promise<boolean> {
    try {
      const result = await matchRepository.deleteById(id);
      if (!result) {
        throw new ApiError('Match not found', 'MATCH_NOT_FOUND', 404);
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete match', 'DATABASE_ERROR', 500);
    }
  }
}

// Export a singleton instance
export const matchService = new MatchService();
