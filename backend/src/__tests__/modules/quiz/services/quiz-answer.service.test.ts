import { jest } from '@jest/globals';
import { QuizAnswerService } from '../../../../modules/quiz/services/quiz-answer.service.js';
import { QuizRedisRepository } from '../../../../modules/quiz/repositories/quiz-redis.repository.js';
import { ScoringService } from '../../../../modules/quiz/services/scoring.service.js';
import { QuizRepository } from '../../../../modules/quiz/repositories/quiz.repository.js';
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

  let quizAnswerService: QuizAnswerService;

  beforeEach(() => {
    mockReset(mockRedisRepo);
    mockReset(mockScoringService);
    mockReset(mockQuizRepo);
    mockReset(mockPrisma);

    quizAnswerService = new QuizAnswerService(
      mockRedisRepo,
      mockScoringService,
      mockQuizRepo,
      mockPrisma
    );
  });

  describe('submitAnswer', () => {
    const userId = 'user-1';
    const quizId = 'quiz-1';
    const questionId = 'question-1';
    const answer = 'Paris';

    it('should throw Error if user already submitted an answer', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(false);

      await expect(
        quizAnswerService.submitAnswer(userId, quizId, questionId, answer)
      ).rejects.toThrow('Already submitted answer for this question');
    });

    it('should throw Error if question not found', async () => {
      mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
      mockQuizRepo.findQuestionById.mockResolvedValue(null);

      await expect(
        quizAnswerService.submitAnswer(userId, quizId, questionId, answer)
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
        quizAnswerService.submitAnswer(userId, quizId, questionId, answer)
      ).rejects.toThrow('Question start time not found');
    });

    it('should calculate correct answer and score, then persist it', async () => {
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

      const mockSession = { id: 'session-1', totalScore: 0 };
      mockPrisma.quizSession.findUnique.mockResolvedValue(mockSession as any);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => await cb(mockPrisma));
      mockPrisma.answer.create.mockResolvedValue({
        id: 'answer-1',
        isCorrect: true,
        pointsAwarded: 500,
      } as any);

      const result = await quizAnswerService.submitAnswer(userId, quizId, questionId, answer);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(500);

      expect(mockPrisma.answer.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          questionId,
          userAnswer: answer,
          isCorrect: true,
          pointsAwarded: 500,
        },
      });

      expect(mockPrisma.quizSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          totalScore: {
            increment: 500,
          },
        },
      });
    });

    it('should handle incorrect answers with 0 points', async () => {
        mockRedisRepo.lockAnswerSubmission.mockResolvedValue(true);
        mockQuizRepo.findQuestionById.mockResolvedValue({
          id: questionId,
          correctAnswer: 'Paris',
          points: 1000,
          timeLimitSeconds: 30,
        } as any);
        mockRedisRepo.getQuestionStartTime.mockResolvedValue(10000);
        
        jest.spyOn(Date, 'now').mockReturnValue(15000); // 5s passed
  
        // Even if scoring would give points, if isCorrect is false, points should be 0
        mockScoringService.calculateScore.mockReturnValue(833);
  
        const mockSession = { id: 'session-1', totalScore: 0 };
        mockPrisma.quizSession.findUnique.mockResolvedValue(mockSession as any);
        mockPrisma.$transaction.mockImplementation(async (cb: any) => await cb(mockPrisma));
        mockPrisma.answer.create.mockResolvedValue({
          id: 'answer-2',
          isCorrect: false,
          pointsAwarded: 0,
        } as any);
  
        const result = await quizAnswerService.submitAnswer(userId, quizId, questionId, 'London');
  
        expect(result.isCorrect).toBe(false);
        expect(result.pointsAwarded).toBe(0);
  
        expect(mockPrisma.answer.create).toHaveBeenCalledWith({
          data: {
            sessionId: 'session-1',
            questionId,
            userAnswer: 'London',
            isCorrect: false,
            pointsAwarded: 0,
          },
        });
      });
  });
});
