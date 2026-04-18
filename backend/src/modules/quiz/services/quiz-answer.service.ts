import { PrismaClient } from '@prisma/client';
import { QuizRedisRepository } from '../repositories/quiz-redis.repository.js';
import { ScoringService } from './scoring.service.js';
import { QuizRepository } from '../repositories/quiz.repository.js';
import { LeaderboardService } from './leaderboard.service.js';

export class QuizAnswerService {
  constructor(
    private redisRepo: QuizRedisRepository,
    private scoringService: ScoringService,
    private quizRepo: QuizRepository,
    private prisma: PrismaClient,
    private leaderboardService: LeaderboardService
  ) {}

  /**
   * Submits an answer for a question in a quiz.
   */
  async submitAnswer(userId: string, quizId: string, questionId: string, answer: string) {
    // 1. Idempotency check via Redis
    const lockAcquired = await this.redisRepo.lockAnswerSubmission(quizId, questionId, userId);
    if (!lockAcquired) {
      throw new Error('Already submitted answer for this question');
    }

    // 2. Fetch question details
    const question = await this.quizRepo.findQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // 3. Get start time from Redis
    const startTime = await this.redisRepo.getQuestionStartTime(quizId, questionId);
    if (startTime === null) {
      throw new Error('Question start time not found');
    }

    // 4. Calculate correctness and score
    const isCorrect = question.correctAnswer.toLowerCase() === answer.trim().toLowerCase();
    const submissionTime = Date.now();
    
    let pointsAwarded = 0;
    if (isCorrect) {
      pointsAwarded = this.scoringService.calculateScore({
        basePoints: question.points,
        startTime,
        submissionTime,
        limitSeconds: question.timeLimitSeconds,
      });
    }

    // 5. Find QuizSession
    const session = await this.prisma.quizSession.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
    });

    if (!session) {
      throw new Error('User has not joined this quiz session');
    }

    // 6. Persistence in transaction
    const answerRecord = await this.prisma.$transaction(async (tx) => {
      const createdAnswer = await tx.answer.create({
        data: {
          sessionId: session.id,
          questionId,
          userAnswer: answer,
          isCorrect,
          pointsAwarded,
        },
      });

      if (pointsAwarded > 0) {
        await tx.quizSession.update({
          where: { id: session.id },
          data: {
            totalScore: {
              increment: pointsAwarded,
            },
          },
        });
        
        // Also update Redis leaderboard
        await this.leaderboardService.addPoints(quizId, userId, pointsAwarded);
      }

      return createdAnswer;
    });

    return answerRecord;
  }
}
