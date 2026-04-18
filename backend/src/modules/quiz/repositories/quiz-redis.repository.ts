import { pubClient } from '../../../config/redis.js';

export class QuizRedisRepository {
  private readonly client = pubClient;

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
}
