import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Redis } from 'ioredis';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import { QuizRedisRepository } from '../../../../modules/quiz/repositories/quiz-redis.repository.js';

describe('QuizRedisRepository', () => {
  let redisMock: DeepMockProxy<Redis>;
  let repository: QuizRedisRepository;

  beforeEach(() => {
    redisMock = mockDeep<Redis>();
    repository = new QuizRedisRepository(redisMock);
  });

  describe('lockAnswerSubmission', () => {
    it('should return true when lock is acquired', async () => {
      (redisMock.set as any).mockResolvedValue('OK');
      const result = await repository.lockAnswerSubmission('quiz1', 'q1', 'user1');
      expect(result).toBe(true);
      expect(redisMock.set as any).toHaveBeenCalledWith(
        'quiz:quiz1:answered:q1:user1',
        '1',
        'EX',
        3600,
        'NX'
      );
    });

    it('should return false when lock is not acquired', async () => {
      (redisMock.set as any).mockResolvedValue(null);
      const result = await repository.lockAnswerSubmission('quiz1', 'q1', 'user1');
      expect(result).toBe(false);
    });
  });

  describe('incrementScore', () => {
    it('should increment user score and return the new score', async () => {
      (redisMock.zincrby as any).mockResolvedValue('100');
      const result = await repository.incrementScore('quiz1', 'user1', 100);
      expect(result).toBe(100);
      expect(redisMock.zincrby).toHaveBeenCalledWith('quiz:quiz1:leaderboard', 100, 'user1');
    });
  });

  describe('getTopScores', () => {
    it('should return formatted top scores', async () => {
      (redisMock.zrevrange as any).mockResolvedValue(['user2', '200', 'user1', '150']);
      const result = await repository.getTopScores('quiz1', 10);
      expect(result).toEqual([
        { userId: 'user2', score: 200 },
        { userId: 'user1', score: 150 },
      ]);
      expect(redisMock.zrevrange).toHaveBeenCalledWith('quiz:quiz1:leaderboard', 0, 9, 'WITHSCORES');
    });
  });
});
