import axios from 'axios';
import { User, RiotAccount } from '../../models/User';

const API_URL = '/api/users';

export interface UserResponse {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  avatar?: string;
  discriminator?: string;
  createdAt: string;
  updatedAt: string;
  riotAccounts?: RiotAccount[];
  roles: string[];
}

// Get current user profile
export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
};

// Get user by ID
export const getUser = async (id: string): Promise<UserResponse> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Update user profile
export const updateUser = async (data: Partial<User>): Promise<UserResponse> => {
  const response = await axios.put(`${API_URL}/me`, data);
  return response.data;
};

// Link Riot account
export const linkRiotAccount = async (summonerName: string, region: string): Promise<RiotAccount> => {
  const response = await axios.post(`${API_URL}/riot-accounts`, { summonerName, region });
  return response.data;
};

// Verify Riot account
export const verifyRiotAccount = async (summonerId: string): Promise<RiotAccount> => {
  const response = await axios.post(`${API_URL}/riot-accounts/${summonerId}/verify`);
  return response.data;
};

// Unlink Riot account
export const unlinkRiotAccount = async (summonerId: string): Promise<void> => {
  await axios.delete(`${API_URL}/riot-accounts/${summonerId}`);
};
