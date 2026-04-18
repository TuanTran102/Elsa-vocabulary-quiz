import { QuizRedisRepository } from '../repositories/quiz-redis.repository.js';

export class LeaderboardService {
  constructor(private readonly redisRepo: QuizRedisRepository) {}

  /**
   * Adds points for a player in the game room leaderboard.
   *
   * @param pin      - The 6-digit game room PIN used as the Redis namespace key.
   * @param playerId - The PlayerResult ID (or socket-assigned player ID).
   * @param points   - Points to add.
   */
  async addPoints(pin: string, playerId: string, points: number): Promise<void> {
    await this.redisRepo.incrementScore(pin, playerId, points);
  }

  /**
   * Returns the top-N leaderboard entries with nicknames from Redis.
   *
   * @param pin   - The 6-digit game room PIN.
   * @param limit - Max number of entries to return (default 10).
   */
  async getLeaderboard(pin: string, limit: number = 10): Promise<{ nickname: string; score: number; rank: number }[]> {
    const topScores = await this.redisRepo.getTopScores(pin, limit);
    if (topScores.length === 0) {
      return [];
    }

    const enriched = await Promise.all(
      topScores.map(async (ts, index) => {
        const nickname = await this.redisRepo.getNickname(pin, ts.userId);
        return {
          nickname: nickname ?? 'Unknown',
          score: ts.score,
          rank: index + 1,
        };
      })
    );

    return enriched;
  }

  async getPlayerScore(pin: string, playerId: string): Promise<number> {
    return this.redisRepo.getPlayerScore(pin, playerId);
  }

  async getPlayerRank(pin: string, playerId: string): Promise<number> {
    return this.redisRepo.getPlayerRank(pin, playerId);
  }
}
