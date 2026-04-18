import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import { LeaderboardService } from '../../../../modules/quiz/services/leaderboard.service.js';
import { QuizRedisRepository } from '../../../../modules/quiz/repositories/quiz-redis.repository.js';

describe('LeaderboardService', () => {
  let redisRepoMock: DeepMockProxy<QuizRedisRepository>;
  let service: LeaderboardService;

  beforeEach(() => {
    redisRepoMock = mockDeep<QuizRedisRepository>();
    mockReset(redisRepoMock);
    service = new LeaderboardService(redisRepoMock);
  });

  describe('addPoints', () => {
    it('should call redis repository to increment score using pin and playerId', async () => {
      redisRepoMock.incrementScore.mockResolvedValue(100);
      await service.addPoints('ABC123', 'player-1', 100);
      expect(redisRepoMock.incrementScore).toHaveBeenCalledWith('ABC123', 'player-1', 100);
    });
  });

  describe('getLeaderboard', () => {
    it('should return enriched leaderboard with nicknames from Redis', async () => {
      const mockTopScores = [
        { userId: 'player-1', score: 300 },
        { userId: 'player-2', score: 200 },
      ];
      redisRepoMock.getTopScores.mockResolvedValue(mockTopScores);
      redisRepoMock.getNickname.mockImplementation(async (_pin: string, playerId: string) => {
        if (playerId === 'player-1') return 'Alice';
        if (playerId === 'player-2') return 'Bob';
        return null;
      });

      const result = await service.getLeaderboard('ABC123');

      expect(result).toEqual([
        { nickname: 'Alice', score: 300 },
        { nickname: 'Bob', score: 200 },
      ]);
      expect(redisRepoMock.getTopScores).toHaveBeenCalledWith('ABC123', 10);
      expect(redisRepoMock.getNickname).toHaveBeenCalledWith('ABC123', 'player-1');
      expect(redisRepoMock.getNickname).toHaveBeenCalledWith('ABC123', 'player-2');
    });

    it('should return empty array when no scores exist', async () => {
      redisRepoMock.getTopScores.mockResolvedValue([]);

      const result = await service.getLeaderboard('ABC123');

      expect(result).toEqual([]);
      expect(redisRepoMock.getNickname).not.toHaveBeenCalled();
    });

    it('should fall back to "Unknown" when nickname is not found in Redis', async () => {
      const mockTopScores = [
        { userId: 'player-1', score: 300 },
        { userId: 'expired-player', score: 100 },
      ];
      redisRepoMock.getTopScores.mockResolvedValue(mockTopScores);
      redisRepoMock.getNickname.mockImplementation(async (_pin: string, playerId: string) => {
        if (playerId === 'player-1') return 'Alice';
        return null; // expired session
      });

      const result = await service.getLeaderboard('ABC123');

      expect(result).toEqual([
        { nickname: 'Alice', score: 300 },
        { nickname: 'Unknown', score: 100 },
      ]);
    });

    it('should respect the limit parameter', async () => {
      redisRepoMock.getTopScores.mockResolvedValue([]);

      await service.getLeaderboard('ABC123', 5);

      expect(redisRepoMock.getTopScores).toHaveBeenCalledWith('ABC123', 5);
    });
  });
});
