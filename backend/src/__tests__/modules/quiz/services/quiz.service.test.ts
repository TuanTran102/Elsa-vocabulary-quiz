import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import { QuizService } from '../../../../modules/quiz/services/quiz.service.js';
import { QuizRepository } from '../../../../modules/quiz/repositories/quiz.repository.js';

describe('QuizService', () => {
  let repositoryMock: DeepMockProxy<QuizRepository>;
  let service: QuizService;

  beforeEach(() => {
    repositoryMock = mockDeep<QuizRepository>();
    service = new QuizService(repositoryMock);
  });

  describe('getQuizzes', () => {
    it('should return quizzes from repository', async () => {
      const mockQuizzes = [{ id: '1', title: 'Quiz 1', _count: { questions: 5 } }];
      repositoryMock.findAll.mockResolvedValue(mockQuizzes as any);

      const result = await service.getQuizzes();

      expect(result).toEqual([
        { id: '1', title: 'Quiz 1', _count: { questions: 5 } }
      ]);
      expect(repositoryMock.findAll).toHaveBeenCalled();
    });
  });

  describe('getQuizById', () => {
    it('should return a quiz from repository', async () => {
      const mockQuiz = { id: '1', title: 'Quiz 1' };
      repositoryMock.findById.mockResolvedValue(mockQuiz as any);

      const result = await service.getQuizById('1');

      expect(result).toEqual(mockQuiz);
      expect(repositoryMock.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if quiz not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.getQuizById('999')).rejects.toThrow('Quiz not found');
    });
  });
});
