import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import type { Request, Response } from 'express';
import { SessionController } from '../../../modules/session/session.controller.js';
import { SessionService } from '../../../modules/session/session.service.js';
import { SessionStatus } from '../../../modules/session/session.types.js';

describe('SessionController', () => {
  let serviceMock: DeepMockProxy<SessionService>;
  let controller: SessionController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    serviceMock = mockDeep<SessionService>();
    controller = new SessionController(serviceMock);
    req = {};
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  describe('create', () => {
    it('should return 201 and session data', async () => {
      req.body = { quiz_id: 'quiz-1' };
      const mockResult = {
        pin: '123456',
        gameRoomId: 'room-1',
        quizTitle: 'Test Quiz'
      };
      serviceMock.createSession.mockResolvedValue(mockResult);

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          session_id: 'room-1', // Match response format from plan
          game_room_id: 'room-1',
          pin: '123456',
          quiz_title: 'Test Quiz'
        }
      });
    });

    it('should return 404 if quiz not found', async () => {
      req.body = { quiz_id: 'invalid-id' };
      serviceMock.createSession.mockRejectedValue(new Error('Quiz not found'));

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quiz not found' });
    });
  });

  describe('show', () => {
    it('should return 200 and session details', async () => {
      req.params = { pin: '123456' };
      const mockSession = {
        id: 'room-1',
        pin: '123456',
        quizId: 'quiz-1',
        quizTitle: 'Test Quiz',
        status: SessionStatus.WAITING,
        playerCount: 5
      };
      serviceMock.getSession.mockResolvedValue(mockSession);

      await controller.show(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          game_room_id: 'room-1',
          quiz_title: 'Test Quiz',
          status: 'WAITING',
          player_count: 5
        })
      });
    });

    it('should return 404 if session not found', async () => {
      req.params = { pin: '999999' };
      serviceMock.getSession.mockResolvedValue(null);

      await controller.show(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session not found or completed' });
    });
  });
});
