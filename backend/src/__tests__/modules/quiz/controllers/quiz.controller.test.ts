import { jest, describe, it, expect, beforeEach } from '@jest/globals'; 
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import type { Request, Response } from 'express';
import { QuizController } from '../../../../modules/quiz/controllers/quiz.controller.js';
import { QuizService } from '../../../../modules/quiz/services/quiz.service.js';

describe('QuizController', () => {
  let serviceMock: DeepMockProxy<QuizService>;
  let controller: QuizController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    serviceMock = mockDeep<QuizService>();
    controller = new QuizController(serviceMock);
    req = {};
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  describe('index', () => {
    it('should return 200 and a list of quizzes', async () => {
      const mockQuizzes = [{ id: '1', title: 'Quiz 1' }];
      serviceMock.getQuizzes.mockResolvedValue(mockQuizzes as any);

      await controller.index(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockQuizzes });
    });
  });

  describe('show', () => {
    it('should return 200 and quiz details', async () => {
      const mockQuiz = { id: '1', title: 'Quiz 1', questions: [] };
      req.params = { id: '1' };
      serviceMock.getQuizById.mockResolvedValue(mockQuiz as any);

      await controller.show(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockQuiz });
    });

    it('should return 404 if quiz not found', async () => {
      req.params = { id: '999' };
      serviceMock.getQuizById.mockRejectedValue(new Error('Quiz not found'));

      await controller.show(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quiz not found' });
    });

    it('should return 500 if an unexpected error occurs in index', async () => {
      serviceMock.getQuizzes.mockRejectedValue(new Error('Unexpected error'));

      await controller.index(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected error' });
    });

    it('should return 500 if an unexpected error occurs in show', async () => {
      req.params = { id: '1' };
      serviceMock.getQuizById.mockRejectedValue(new Error('Unexpected error'));

      await controller.show(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected error' });
    });
  });
});
