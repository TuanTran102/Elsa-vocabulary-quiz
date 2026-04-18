import type { PrismaClient } from '@prisma/client';
import { QuizRedisRepository } from '../repositories/quiz-redis.repository.js';

export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redisRepo: QuizRedisRepository
  ) {}

  async addPoints(quizId: string, userId: string, points: number): Promise<void> {
    await this.redisRepo.incrementScore(quizId, userId, points);
  }

  async getLeaderboard(quizId: string, limit: number = 10): Promise<{ username: string; score: number }[]> {
    const topScores = await this.redisRepo.getTopScores(quizId, limit);
    if (topScores.length === 0) {
      return [];
    }

    const userIds = topScores.map(ts => ts.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.username]));

    return topScores.map(ts => ({
      username: userMap.get(ts.userId) || 'Unknown',
      score: ts.score,
    }));
  }
}
