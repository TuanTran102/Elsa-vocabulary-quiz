import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/db.js';
import { disconnectRedis } from '../config/redis.js';

describe('Quiz Integration Tests', () => {
  let quizId: string;

  beforeAll(async () => {
    // Seed a test quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Integration Test Quiz',
        questions: {
          create: [
            {
              content: 'What is 1+1?',
              options: ['1', '2', '3', '4'],
              correctAnswer: '2',
              points: 1000,
              timeLimitSeconds: 30
            }
          ]
        }
      }
    });
    quizId = quiz.id;
  });

  afterAll(async () => {
    // Cleanup only test data
    await prisma.answer.deleteMany({
      where: {
        question: { quizId: quizId }
      }
    });
    await prisma.playerResult.deleteMany({
      where: { gameRoom: { quizId: quizId } }
    });
    await prisma.gameRoom.deleteMany({
      where: { quizId: quizId }
    });
    await prisma.question.deleteMany({
      where: { quizId: quizId }
    });
    await prisma.quiz.delete({
      where: { id: quizId }
    });
    await prisma.$disconnect();
    await disconnectRedis();
  });

  describe('GET /api/v1/quizzes', () => {
    it('should return 200 and a list of quizzes', async () => {
      const response = await request(app).get('/api/v1/quizzes');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      const testQuiz = response.body.data.find((q: any) => q.id === quizId);
      expect(testQuiz).toBeDefined();
      expect(testQuiz.questions_count).toBe(1);
    });
  });

  describe('GET /api/v1/quizzes/:id', () => {
    it('should return 200 and quiz details', async () => {
      const response = await request(app).get(`/api/v1/quizzes/${quizId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(quizId);
      expect(response.body.data.questions).toBeDefined();
      expect(response.body.data.questions.length).toBe(1);
      expect(response.body.data.questions[0].correctAnswer).toBeUndefined(); // Verification of safety
    });

    it('should return 404 for non-existent quiz', async () => {
      const response = await request(app).get('/api/v1/quizzes/non-existent-id');
      expect(response.status).toBe(404);
    });
  });
});
