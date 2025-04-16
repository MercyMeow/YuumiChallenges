import { ObjectId } from 'mongodb';

export interface Challenge {
  _id?: ObjectId;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  requirements: ChallengeRequirement[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId | string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  tags: string[];
}

export interface ChallengeRequirement {
  type: 'champion' | 'item' | 'stat' | 'custom';
  description: string;
  value: string | number;
  operator?: 'equal' | 'greater' | 'less' | 'greater_equal' | 'less_equal';
  gameMode?: string[];
}

export interface ChallengeSubmission {
  _id?: ObjectId;
  challengeId: ObjectId | string;
  userId: ObjectId | string;
  status: 'pending' | 'approved' | 'rejected';
  matchId: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: ObjectId | string;
  notes?: string;
  evidence?: string;
}

export const ChallengeCollection = 'challenges';
export const ChallengeSubmissionCollection = 'challenge_submissions';

// Helper functions for challenge operations
export const challengeHelpers = {
  // Format challenge data for client-side consumption
  formatChallenge: (challenge: Challenge): Omit<Challenge, '_id'> & { id: string } => {
    const { _id, ...challengeData } = challenge;
    return {
      id: _id?.toString() || '',
      ...challengeData,
    };
  },
  
  // Create a new challenge object
  createChallenge: (data: Partial<Challenge>, createdBy: string): Omit<Challenge, '_id'> => {
    const now = new Date();
    return {
      title: data.title || '',
      description: data.description || '',
      difficulty: data.difficulty || 'medium',
      points: data.points || 100,
      requirements: data.requirements || [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      isActive: data.isActive ?? true,
      startDate: data.startDate,
      endDate: data.endDate,
      tags: data.tags || [],
    };
  },
};
