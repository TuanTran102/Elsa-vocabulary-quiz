import { Redis } from 'ioredis';
import { pubClient } from '../../../config/redis.js';

export class QuizRedisRepository {
  private readonly client: Redis;

  constructor(client: Redis = pubClient) {
    this.client = client;
  }

  /**
   * Locks answer submission for a specific player and question using SETNX.
   * Returns true if the lock was successfully acquired, false otherwise.
   */
  async lockAnswerSubmission(pin: string, questionId: string, playerId: string): Promise<boolean> {
    const key = `quiz:${pin}:answered:${questionId}:${playerId}`;
    // NX: Only set the key if it does not already exist.
    // EX 3600: Set the specified expire time, in seconds.
    const result = await this.client.set(key, '1', 'EX', 3600, 'NX');
    return result === 'OK';
  }

  /**
   * Retrieves the start timestamp for a question.
   */
  async getQuestionStartTime(pin: string, questionId: string): Promise<number | null> {
    const key = `quiz:${pin}:question:${questionId}:start_time`;
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : null;
  }

  /**
   * Sets the start timestamp for a question.
   */
  async setQuestionStartTime(pin: string, questionId: string, startTime: number): Promise<void> {
    const key = `quiz:${pin}:question:${questionId}:start_time`;
    await this.client.set(key, startTime.toString(), 'EX', 3600);
  }

  /**
   * Increments a player's score in a game room leaderboard.
   */
  async incrementScore(pin: string, playerId: string, score: number): Promise<number> {
    const key = `quiz:${pin}:leaderboard`;
    const result = await this.client.zincrby(key, score, playerId);
    return parseFloat(result);
  }

  /**
   * Retrieves the top scores from a game room leaderboard.
   */
  async getTopScores(pin: string, limit: number): Promise<{ userId: string; score: number }[]> {
    const key = `quiz:${pin}:leaderboard`;
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

  /**
   * Retrieves a player's nickname stored in the Redis session for a game room.
   * Returns null if the session has expired or the player is not found.
   */
  async getNickname(pin: string, playerId: string): Promise<string | null> {
    const key = `session:${pin}:player:${playerId}:nickname`;
    return await this.client.get(key);
  }

  /**
   * Stores a player's nickname in Redis for the duration of the game.
   */
  async setNickname(pin: string, playerId: string, nickname: string): Promise<void> {
    const key = `session:${pin}:player:${playerId}:nickname`;
    await this.client.set(key, nickname, 'EX', 7200); // 2 hour TTL
  }
  
  /**
   * Gets a player's score from the leaderboard.
   */
  async getPlayerScore(pin: string, playerId: string): Promise<number> {
    const key = `quiz:${pin}:leaderboard`;
    const score = await this.client.zscore(key, playerId);
    return score ? parseFloat(score) : 0;
  }

  /**
   * Gets a player's rank from the leaderboard (1-indexed).
   */
  async getPlayerRank(pin: string, playerId: string): Promise<number> {
    const key = `quiz:${pin}:leaderboard`;
    const rank = await this.client.zrevrank(key, playerId);
    return rank !== null ? rank + 1 : 0;
  }
}
