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
   * Submits an answer for a question in a game room.
   *
   * @param playerResultId - The PlayerResult ID for the player (resolved from Redis by the Gateway).
   * @param pin            - The 6-digit game room PIN used as the Redis namespace key.
   * @param questionId     - The question being answered.
   * @param answer         - The player's answer text.
   */
  async submitAnswer(playerResultId: string, pin: string, questionId: string, answer: string) {
    // 1. Idempotency check via Redis
    const lockAcquired = await this.redisRepo.lockAnswerSubmission(pin, questionId, playerResultId);
    if (!lockAcquired) {
      throw new Error('Already submitted answer for this question');
    }

    // 2. Fetch question details
    const question = await this.quizRepo.findQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // 3. Get start time from Redis
    const startTime = await this.redisRepo.getQuestionStartTime(pin, questionId);
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

    // 5. Persist answer in transaction (no QuizSession lookup needed)
    const answerRecord = await this.prisma.$transaction(async (tx) => {
      const createdAnswer = await tx.answer.create({
        data: {
          playerResultId,
          questionId,
          userAnswer: answer,
          isCorrect,
          pointsAwarded,
        },
      });

      if (pointsAwarded > 0) {
        // Update Redis leaderboard using PIN as namespace
        await this.leaderboardService.addPoints(pin, playerResultId, pointsAwarded);
      }

      return createdAnswer;
    });

    return answerRecord;
  }
}
