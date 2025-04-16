import { Filter, ObjectId } from 'mongodb';
import { BaseRepository } from './BaseRepository';
import { Challenge, ChallengeCollection, ChallengeSubmission, ChallengeSubmissionCollection } from '@/models/Challenge';

/**
 * Repository for Challenge collection
 */
export class ChallengeRepository extends BaseRepository<Challenge> {
  constructor() {
    super(ChallengeCollection);
  }

  /**
   * Find active challenges
   */
  async findActive(): Promise<Challenge[]> {
    const now = new Date();
    return this.find({
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gt: now } }
      ],
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ]
    } as Filter<Challenge>);
  }

  /**
   * Find challenges by difficulty
   */
  async findByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<Challenge[]> {
    return this.find({ difficulty } as Filter<Challenge>);
  }

  /**
   * Find challenges by tag
   */
  async findByTag(tag: string): Promise<Challenge[]> {
    return this.find({ tags: tag } as Filter<Challenge>);
  }

  /**
   * Find challenges created by a specific user
   */
  async findByCreator(creatorId: string | ObjectId): Promise<Challenge[]> {
    const objectId = typeof creatorId === 'string' ? new ObjectId(creatorId) : creatorId;
    return this.find({ createdBy: objectId } as Filter<Challenge>);
  }

  /**
   * Search challenges by title or description
   */
  async search(query: string): Promise<Challenge[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ]
    } as Filter<Challenge>);
  }

  /**
   * Activate or deactivate a challenge
   */
  async setActive(challengeId: string | ObjectId, isActive: boolean): Promise<Challenge | null> {
    return this.updateById(challengeId, { isActive, updatedAt: new Date() });
  }
}

/**
 * Repository for Challenge Submission collection
 */
export class ChallengeSubmissionRepository extends BaseRepository<ChallengeSubmission> {
  constructor() {
    super(ChallengeSubmissionCollection);
  }

  /**
   * Find submissions for a specific challenge
   */
  async findByChallenge(challengeId: string | ObjectId): Promise<ChallengeSubmission[]> {
    const objectId = typeof challengeId === 'string' ? new ObjectId(challengeId) : challengeId;
    return this.find({ challengeId: objectId } as Filter<ChallengeSubmission>);
  }

  /**
   * Find submissions by a specific user
   */
  async findByUser(userId: string | ObjectId): Promise<ChallengeSubmission[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.find({ userId: objectId } as Filter<ChallengeSubmission>);
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<ChallengeSubmission[]> {
    return this.find({ status } as Filter<ChallengeSubmission>);
  }

  /**
   * Find a user's submission for a specific challenge
   */
  async findUserSubmission(userId: string | ObjectId, challengeId: string | ObjectId): Promise<ChallengeSubmission | null> {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const challengeObjectId = typeof challengeId === 'string' ? new ObjectId(challengeId) : challengeId;
    
    return this.findOne({
      userId: userObjectId,
      challengeId: challengeObjectId
    } as Filter<ChallengeSubmission>);
  }

  /**
   * Update submission status
   */
  async updateStatus(
    submissionId: string | ObjectId,
    status: 'pending' | 'approved' | 'rejected',
    reviewerId?: string | ObjectId,
    notes?: string
  ): Promise<ChallengeSubmission | null> {
    const update: Partial<ChallengeSubmission> = {
      status,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };

    if (reviewerId) {
      update.reviewedBy = typeof reviewerId === 'string' ? new ObjectId(reviewerId) : reviewerId;
    }

    if (notes) {
      update.notes = notes;
    }

    return this.updateById(submissionId, update);
  }
}
