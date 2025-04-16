import axios from 'axios';
import { Match, MatchParticipant, MatchTeam } from '../../models/Match';

const API_URL = '/api/matches';

export interface MatchResponse {
  id: string;
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  platformId: string;
  participants: MatchParticipant[];
  teams: MatchTeam[];
  createdAt: string;
  updatedAt: string;
}

// Get match by ID
export const getMatch = async (id: string): Promise<MatchResponse> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Get recent matches for current user
export const getUserMatches = async (limit: number = 10, offset: number = 0): Promise<MatchResponse[]> => {
  const response = await axios.get(`${API_URL}/user`, {
    params: { limit, offset }
  });
  return response.data;
};

// Get matches by summoner name and region
export const getSummonerMatches = async (
  summonerName: string,
  region: string,
  limit: number = 10,
  offset: number = 0
): Promise<MatchResponse[]> => {
  const response = await axios.get(`${API_URL}/summoner`, {
    params: { summonerName, region, limit, offset }
  });
  return response.data;
};

// Refresh match data from Riot API
export const refreshMatch = async (matchId: string, region: string): Promise<MatchResponse> => {
  const response = await axios.post(`${API_URL}/${matchId}/refresh`, { region });
  return response.data;
};

// Analyze match for challenge completion
export const analyzeMatch = async (matchId: string): Promise<{
  matchId: string;
  eligibleChallenges: { challengeId: string; title: string }[];
}> => {
  const response = await axios.get(`${API_URL}/${matchId}/analyze`);
  return response.data;
};
