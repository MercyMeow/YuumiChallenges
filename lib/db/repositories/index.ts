export * from './BaseRepository';
export * from './UserRepository';
export * from './ChallengeRepository';
export * from './MatchRepository';

// Create singleton instances of repositories
import { UserRepository } from './UserRepository';
import { ChallengeRepository, ChallengeSubmissionRepository } from './ChallengeRepository';
import { MatchRepository } from './MatchRepository';

export const userRepository = new UserRepository();
export const challengeRepository = new ChallengeRepository();
export const challengeSubmissionRepository = new ChallengeSubmissionRepository();
export const matchRepository = new MatchRepository();
