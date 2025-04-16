import { ObjectId } from 'mongodb';
import { challengeRepository, challengeSubmissionRepository } from '../repositories';
import { Challenge, ChallengeSubmission, challengeHelpers } from '@/models/Challenge';
import { ApiError } from '@/types';

/**
 * Service for challenge-related operations
 */
export class ChallengeService {
  /**
   * Get a challenge by ID
   */
  async getChallengeById(id: string): Promise<Challenge> {
    try {
      const challenge = await challengeRepository.findById(id);
      if (!challenge) {
        throw new ApiError('Challenge not found', 'CHALLENGE_NOT_FOUND', 404);
      }
      return challenge;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get challenge', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get all challenges
   */
  async getAllChallenges(page: number = 1, limit: number = 10): Promise<{
    data: Challenge[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      return await challengeRepository.findPaginated({}, page, limit, { sort: { createdAt: -1 } });
    } catch (error) {
      throw new ApiError('Failed to get challenges', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      return await challengeRepository.findActive();
    } catch (error) {
      throw new ApiError('Failed to get active challenges', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Create a new challenge
   */
  async createChallenge(data: Partial<Challenge>, creatorId: string): Promise<Challenge> {
    try {
      const challengeData = challengeHelpers.createChallenge(data, creatorId);
      return await challengeRepository.create(challengeData);
    } catch (error) {
      throw new ApiError('Failed to create challenge', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Update a challenge
   */
  async updateChallenge(id: string, data: Partial<Challenge>): Promise<Challenge> {
    try {
      const updatedChallenge = await challengeRepository.updateById(id, data);
      if (!updatedChallenge) {
        throw new ApiError('Challenge not found', 'CHALLENGE_NOT_FOUND', 404);
      }
      return updatedChallenge;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update challenge', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Delete a challenge
   */
  async deleteChallenge(id: string): Promise<boolean> {
    try {
      const result = await challengeRepository.deleteById(id);
      if (!result) {
        throw new ApiError('Challenge not found', 'CHALLENGE_NOT_FOUND', 404);
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete challenge', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Search challenges
   */
  async searchChallenges(query: string): Promise<Challenge[]> {
    try {
      return await challengeRepository.search(query);
    } catch (error) {
      throw new ApiError('Failed to search challenges', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get challenges by difficulty
   */
  async getChallengesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<Challenge[]> {
    try {
      return await challengeRepository.findByDifficulty(difficulty);
    } catch (error) {
      throw new ApiError('Failed to get challenges by difficulty', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get challenges by tag
   */
  async getChallengesByTag(tag: string): Promise<Challenge[]> {
    try {
      return await challengeRepository.findByTag(tag);
    } catch (error) {
      throw new ApiError('Failed to get challenges by tag', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get challenges created by a user
   */
  async getChallengesByCreator(creatorId: string): Promise<Challenge[]> {
    try {
      return await challengeRepository.findByCreator(creatorId);
    } catch (error) {
      throw new ApiError('Failed to get challenges by creator', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Activate or deactivate a challenge
   */
  async setActive(id: string, isActive: boolean): Promise<Challenge> {
    try {
      const updatedChallenge = await challengeRepository.setActive(id, isActive);
      if (!updatedChallenge) {
        throw new ApiError('Challenge not found', 'CHALLENGE_NOT_FOUND', 404);
      }
      return updatedChallenge;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update challenge status', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Submit a challenge
   */
  async submitChallenge(
    challengeId: string,
    userId: string,
    matchId: string,
    evidence?: string
  ): Promise<ChallengeSubmission> {
    try {
      // Check if challenge exists
      const challenge = await challengeRepository.findById(challengeId);
      if (!challenge) {
        throw new ApiError('Challenge not found', 'CHALLENGE_NOT_FOUND', 404);
      }

      // Check if user has already submitted this challenge
      const existingSubmission = await challengeSubmissionRepository.findUserSubmission(userId, challengeId);
      if (existingSubmission) {
        throw new ApiError('You have already submitted this challenge', 'ALREADY_SUBMITTED', 409);
      }

      // Create submission
      const submission: Omit<ChallengeSubmission, '_id'> = {
        challengeId: new ObjectId(challengeId),
        userId: new ObjectId(userId),
        status: 'pending',
        matchId,
        submittedAt: new Date(),
        evidence
      };

      return await challengeSubmissionRepository.create(submission);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to submit challenge', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get a submission by ID
   */
  async getSubmissionById(id: string): Promise<ChallengeSubmission> {
    try {
      const submission = await challengeSubmissionRepository.findById(id);
      if (!submission) {
        throw new ApiError('Submission not found', 'SUBMISSION_NOT_FOUND', 404);
      }
      return submission;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get submission', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get submissions for a challenge
   */
  async getSubmissionsByChallenge(challengeId: string): Promise<ChallengeSubmission[]> {
    try {
      return await challengeSubmissionRepository.findByChallenge(challengeId);
    } catch (error) {
      throw new ApiError('Failed to get submissions', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get submissions by a user
   */
  async getSubmissionsByUser(userId: string): Promise<ChallengeSubmission[]> {
    try {
      return await challengeSubmissionRepository.findByUser(userId);
    } catch (error) {
      throw new ApiError('Failed to get submissions', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Review a submission
   */
  async reviewSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    notes?: string
  ): Promise<ChallengeSubmission> {
    try {
      const updatedSubmission = await challengeSubmissionRepository.updateStatus(
        submissionId,
        status,
        reviewerId,
        notes
      );
      
      if (!updatedSubmission) {
        throw new ApiError('Submission not found', 'SUBMISSION_NOT_FOUND', 404);
      }
      
      return updatedSubmission;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to review submission', 'DATABASE_ERROR', 500);
    }
  }
}

// Export a singleton instance
export const challengeService = new ChallengeService();
