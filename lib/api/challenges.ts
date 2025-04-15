import axios from 'axios';
import { Challenge, ChallengeSubmission } from '../../models/Challenge';

const API_URL = '/api/challenges';

export interface ChallengeResponse {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  requirements: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  tags: string[];
}

export interface ChallengeSubmissionResponse {
  id: string;
  challengeId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  matchId: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  evidence?: string;
}

// Get all challenges
export const getChallenges = async (): Promise<ChallengeResponse[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Get a single challenge by ID
export const getChallenge = async (id: string): Promise<ChallengeResponse> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create a new challenge
export const createChallenge = async (challenge: Partial<Challenge>): Promise<ChallengeResponse> => {
  const response = await axios.post(API_URL, challenge);
  return response.data;
};

// Update an existing challenge
export const updateChallenge = async (id: string, challenge: Partial<Challenge>): Promise<ChallengeResponse> => {
  const response = await axios.put(`${API_URL}/${id}`, challenge);
  return response.data;
};

// Delete a challenge
export const deleteChallenge = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

// Submit a challenge completion
export const submitChallenge = async (submission: Partial<ChallengeSubmission>): Promise<ChallengeSubmissionResponse> => {
  const response = await axios.post(`${API_URL}/submit`, submission);
  return response.data;
};

// Get submissions for a challenge
export const getChallengeSubmissions = async (challengeId: string): Promise<ChallengeSubmissionResponse[]> => {
  const response = await axios.get(`${API_URL}/${challengeId}/submissions`);
  return response.data;
};

// Get user's submissions
export const getUserSubmissions = async (): Promise<ChallengeSubmissionResponse[]> => {
  const response = await axios.get(`${API_URL}/submissions/user`);
  return response.data;
};
