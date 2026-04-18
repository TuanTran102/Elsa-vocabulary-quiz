import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { QuizRepository } from '../../../../modules/quiz/repositories/quiz.repository.js';

describe('QuizRepository', () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let repository: QuizRepository;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    repository = new QuizRepository(prismaMock);
  });

  describe('findAll', () => {
    it('should return a list of quizzes', async () => {
      const mockQuizzes = [
        { id: '1', title: 'Quiz 1' },
        { id: '2', title: 'Quiz 2' },
      ];
      
      (prismaMock.quiz.findMany as any).mockResolvedValue(mockQuizzes);

      const result = await repository.findAll();

      expect(result).toEqual(mockQuizzes);
      expect(prismaMock.quiz.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          _count: {
            select: { questions: true }
          }
        }
      });
    });
  });

  describe('findById', () => {
    it('should return a quiz with questions', async () => {
      const mockQuiz = {
        id: '1',
        title: 'Quiz 1',
        questions: [{ id: 'q1', content: 'What is 1+1?' }]
      };
      
      (prismaMock.quiz.findUnique as any).mockResolvedValue(mockQuiz);

      const result = await repository.findById('1');

      expect(result).toEqual(mockQuiz);
      expect(prismaMock.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          questions: {
            select: {
              id: true,
              content: true,
              options: true,
              points: true,
              timeLimitSeconds: true
            }
          }
        }
      });
    });

    it('should return null if quiz not found', async () => {
      (prismaMock.quiz.findUnique as any).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });
});
