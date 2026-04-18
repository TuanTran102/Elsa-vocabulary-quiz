import { Redis } from 'ioredis';
import { pubClient } from '../../../config/redis.js';

export class QuizRedisRepository {
  private readonly client: Redis;

  constructor(client: Redis = pubClient) {
    this.client = client;
  }

  /**
   * Locks answer submission for a specific user and question using SETNX.
   * Returns true if the lock was successfully acquired, false otherwise.
   */
  async lockAnswerSubmission(quizId: string, questionId: string, userId: string): Promise<boolean> {
    const key = `quiz:${quizId}:answered:${questionId}:${userId}`;
    // NX: Only set the key if it does not already exist.
    // EX 3600: Set the specified expire time, in seconds.
    const result = await this.client.set(key, '1', 'EX', 3600, 'NX');
    return result === 'OK';
  }

  /**
   * Retrieves the start timestamp for a question.
   */
  async getQuestionStartTime(quizId: string, questionId: string): Promise<number | null> {
    const key = `quiz:${quizId}:question:${questionId}:start_time`;
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : null;
  }

  /**
   * Sets the start timestamp for a question.
   */
  async setQuestionStartTime(quizId: string, questionId: string, startTime: number): Promise<void> {
    const key = `quiz:${quizId}:question:${questionId}:start_time`;
    await this.client.set(key, startTime.toString(), 'EX', 3600);
  }

  /**
   * Increments a user's score in a quiz leaderboard.
   */
  async incrementScore(quizId: string, userId: string, score: number): Promise<number> {
    const key = `quiz:${quizId}:leaderboard`;
    const result = await this.client.zincrby(key, score, userId);
    return parseFloat(result);
  }

  /**
   * Retrieves the top scores from a quiz leaderboard.
   */
  async getTopScores(quizId: string, limit: number): Promise<{ userId: string; score: number }[]> {
    const key = `quiz:${quizId}:leaderboard`;
    const result = await this.client.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    
    const scores: { userId: string; score: number }[] = [];
    for (let i = 0; i < result.length; i += 2) {
      const userId = result[i];
      const scoreStr = result[i + 1];
      if (userId !== undefined && scoreStr !== undefined) {
        scores.push({
          userId,
          score: parseFloat(scoreStr),
        });
      }
    }
    return scores;
  }
}
