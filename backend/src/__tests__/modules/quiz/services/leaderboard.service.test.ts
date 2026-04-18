import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { LeaderboardService } from '../../../../modules/quiz/services/leaderboard.service.js';
import { QuizRedisRepository } from '../../../../modules/quiz/repositories/quiz-redis.repository.js';

describe('LeaderboardService', () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let redisRepoMock: DeepMockProxy<QuizRedisRepository>;
  let service: LeaderboardService;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    redisRepoMock = mockDeep<QuizRedisRepository>();
    service = new LeaderboardService(prismaMock, redisRepoMock);
  });

  describe('addPoints', () => {
    it('should call redis repository to increment score', async () => {
      redisRepoMock.incrementScore.mockResolvedValue(100);
      await service.addPoints('quiz1', 'user1', 100);
      expect(redisRepoMock.incrementScore).toHaveBeenCalledWith('quiz1', 'user1', 100);
    });
  });

  describe('getLeaderboard', () => {
    it('should return enriched leaderboard data', async () => {
      const mockTopScores = [
        { userId: 'user1', score: 300 },
        { userId: 'user2', score: 200 },
      ];
      redisRepoMock.getTopScores.mockResolvedValue(mockTopScores);

      (prismaMock.user.findMany as any).mockResolvedValue([
        { id: 'user1', username: 'JohnDoe' },
        { id: 'user2', username: 'JaneDoe' },
      ]);

      const result = await service.getLeaderboard('quiz1');

      expect(result).toEqual([
        { username: 'JohnDoe', score: 300 },
        { username: 'JaneDoe', score: 200 },
      ]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user1', 'user2'] } },
        select: { id: true, username: true },
      });
    });

    it('should handle missing users gracefully', async () => {
      const mockTopScores = [
        { userId: 'user1', score: 300 },
        { userId: 'missing', score: 100 },
      ];
      redisRepoMock.getTopScores.mockResolvedValue(mockTopScores);

      (prismaMock.user.findMany as any).mockResolvedValue([
        { id: 'user1', username: 'JohnDoe' },
      ]);

      const result = await service.getLeaderboard('quiz1');

      expect(result).toEqual([
        { username: 'JohnDoe', score: 300 },
        { username: 'Unknown', score: 100 },
      ]);
    });
  });
});
