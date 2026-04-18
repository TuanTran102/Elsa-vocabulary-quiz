import { jest } from '@jest/globals';
import { QuizAnswerService } from '../../../../modules/quiz/services/quiz-answer.service.js';
import { QuizRedisRepository } from '../../../../modules/quiz/repositories/quiz-redis.repository.js';
import { ScoringService } from '../../../../modules/quiz/services/scoring.service.js';
import { QuizRepository } from '../../../../modules/quiz/repositories/quiz.repository.js';
import { LeaderboardService } from '../../../../modules/quiz/services/leaderboard.service.js';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock the redis config to prevent actual connections
jest.mock('../../../../config/redis', () => ({
  pubClient: {
    set: jest.fn(),
    get: jest.fn(),
  },
  disconnectRedis: jest.fn(),
}));

describe('QuizAnswerService', () => {
  const mockRedisRepo = mockDeep<QuizRedisRepository>();
  const mockScoringService = mockDeep<ScoringService>();
  const mockQuizRepo = mockDeep<QuizRepository>();
  const mockPrisma = mockDeep<PrismaClient>();
  const mockLeaderboardService = mockDeep<LeaderboardService>();

  let quizAnswerService: QuizAnswerService;

  beforeEach(() => {
    mockReset(mockRedisRepo);
    mockReset(mockScoringService);
    mockReset(mockQuizRepo);
    mockReset(mockPrisma);
    mockReset(mockLeaderboardService);

    quizAnswerService = new QuizAnswerService(
      mockRedisRepo,
      mockScoringService,
      mockQuizRepo,
      mockPrisma,
      mockLeaderboardService
    );
  });

  describe('submitAnswer', () => {
    const playerResultId = 'player-result-1';
    const pin = 'ABC123';
    const questionId = 'question-1';
    const answer = 'Paris';

    it('should throw Error if player already submitted an answer', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(false);

      await expect(
        quizAnswerService.submitAnswer(playerResultId, pin, questionId, answer)
      ).rejects.toThrow('Already submitted answer for this question');
    });

    it('should throw Error if question not found', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
      mockQuizRepo.findQuestionById.mockResolvedValue(null);

      await expect(
        quizAnswerService.submitAnswer(playerResultId, pin, questionId, answer)
      ).rejects.toThrow('Question not found');
    });

    it('should throw Error if question start time not found in Redis', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
      mockQuizRepo.findQuestionById.mockResolvedValue({
        id: questionId,
        correctAnswer: 'Paris',
        points: 1000,
        timeLimitSeconds: 30,
      } as any);
      mockRedisRepo.getQuestionStartTime.mockResolvedValue(null);

      await expect(
        quizAnswerService.submitAnswer(playerResultId, pin, questionId, answer)
      ).rejects.toThrow('Question start time not found');
    });

    it('should skip session lookup and persist answer using playerResultId on correct answer', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
      mockQuizRepo.findQuestionById.mockResolvedValue({
        id: questionId,
        correctAnswer: 'Paris',
        points: 1000,
        timeLimitSeconds: 30,
      } as any);
      mockRedisRepo.getQuestionStartTime.mockResolvedValue(10000);

      // Mock Date.now() to 25000 (15s passed)
      jest.spyOn(Date, 'now').mockReturnValue(25000);

      mockScoringService.calculateScore.mockReturnValue(500);

      mockPrisma.$transaction.mockImplementation(async (cb: any) => await cb(mockPrisma));
      mockPrisma.answer.create.mockResolvedValue({
        id: 'answer-1',
        isCorrect: true,
        pointsAwarded: 500,
      } as any);

      const result = await quizAnswerService.submitAnswer(playerResultId, pin, questionId, answer);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(500);

      // No QuizSession lookup — the property doesn't exist on the new PrismaClient type
      // The service goes straight to answer.create with playerResultId

      expect(mockPrisma.answer.create).toHaveBeenCalledWith({
        data: {
          playerResultId,
          questionId,
          userAnswer: answer,
          isCorrect: true,
          pointsAwarded: 500,
        },
      });

      expect(mockLeaderboardService.addPoints).toHaveBeenCalledWith(pin, playerResultId, 500);
    });

    it('should handle incorrect answers with 0 points without calling leaderboard', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
      mockQuizRepo.findQuestionById.mockResolvedValue({
        id: questionId,
        correctAnswer: 'Paris',
        points: 1000,
        timeLimitSeconds: 30,
      } as any);
      mockRedisRepo.getQuestionStartTime.mockResolvedValue(10000);

      jest.spyOn(Date, 'now').mockReturnValue(15000); // 5s passed

      mockScoringService.calculateScore.mockReturnValue(833);

      mockPrisma.$transaction.mockImplementation(async (cb: any) => await cb(mockPrisma));
      mockPrisma.answer.create.mockResolvedValue({
        id: 'answer-2',
        isCorrect: false,
        pointsAwarded: 0,
      } as any);

      const result = await quizAnswerService.submitAnswer(playerResultId, pin, questionId, 'London');

      expect(result.isCorrect).toBe(false);
      expect(result.pointsAwarded).toBe(0);

      expect(mockPrisma.answer.create).toHaveBeenCalledWith({
        data: {
          playerResultId,
          questionId,
          userAnswer: 'London',
          isCorrect: false,
          pointsAwarded: 0,
        },
      });

      expect(mockLeaderboardService.addPoints).not.toHaveBeenCalled();
    });
  });
});
