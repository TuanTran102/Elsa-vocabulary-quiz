import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import { SessionService } from '../../../modules/session/session.service.js';
import { SessionStatus } from '../../../modules/session/session.types.js';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';

describe('SessionService', () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let redisMock: DeepMockProxy<Redis>;
  let service: SessionService;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    redisMock = mockDeep<Redis>();
    service = new SessionService(prismaMock as any, redisMock as any);
  });

  describe('createSession', () => {
    it('should throw error if quiz does not exist', async () => {
      prismaMock.quiz.findUnique.mockResolvedValue(null);

      await expect(service.createSession('invalid-id')).rejects.toThrow('Quiz not found');
    });

    it('should create a new session and save to both DB and Redis', async () => {
      const mockQuiz = { id: 'quiz-1', title: 'Test Quiz' };
      prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz as any);
      
      const mockGameRoom = { 
        id: 'room-1', 
        pin: '123456', 
        quizId: 'quiz-1', 
        status: 'WAITING' 
      };
      prismaMock.gameRoom.create.mockResolvedValue(mockGameRoom as any);
      
      // Mock unique PIN generation (exists returns 0)
      redisMock.exists.mockResolvedValue(0);

      const result = await service.createSession('quiz-1');

      expect(result).toEqual({
        pin: expect.any(String),
        gameRoomId: 'room-1',
        quizTitle: 'Test Quiz'
      });
      expect(result.pin).toHaveLength(6);
      
      expect(prismaMock.gameRoom.create).toHaveBeenCalled();
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('session:') as any,
        expect.any(String) as any,
        'EX' as any,
        7200 as any
      );
    });

    it('should retry PIN generation if it already exists in Redis', async () => {
      const mockQuiz = { id: 'quiz-1', title: 'Test Quiz' };
      prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz as any);
      
      // First call returns 1 (exists), second returns 0 (not exists)
      redisMock.exists
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      prismaMock.gameRoom.create.mockResolvedValue({ id: 'room-1', pin: '654321' } as any);

      await service.createSession('quiz-1');

      expect(redisMock.exists).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSession', () => {
    it('should return session from Redis if available', async () => {
      const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.WAITING,
        quizTitle: 'Test Quiz'
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      const result = await service.getSession('123456');

      expect(result).toEqual(mockSession);
      expect(redisMock.get).toHaveBeenCalledWith('session:123456');
      expect(prismaMock.gameRoom.findUnique).not.toHaveBeenCalled();
    });

    it('should fallback to DB if not in Redis and update Redis', async () => {
      redisMock.get.mockResolvedValue(null);
      
      const mockGameRoom = {
        id: 'room-1',
        pin: '123456',
        status: 'WAITING',
        quizId: 'quiz-1',
        quiz: {
          title: 'Test Quiz'
        },
        _count: {
          results: 5
        }
      };
      prismaMock.gameRoom.findUnique.mockResolvedValue(mockGameRoom as any);

      const result = await service.getSession('123456');

      expect(result).toEqual({
        id: 'room-1',
        pin: '123456',
        quizId: 'quiz-1',
        quizTitle: 'Test Quiz',
        status: SessionStatus.WAITING,
        playerCount: 5,
        players: []
      });
      expect(redisMock.set).toHaveBeenCalled();
    });

    it('should return null if not in Redis and not in DB', async () => {
      redisMock.get.mockResolvedValue(null);
      prismaMock.gameRoom.findUnique.mockResolvedValue(null);

      const result = await service.getSession('999999');

      expect(result).toBeNull();
    });

    it('should return null if status is COMPLETED', async () => {
       const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.COMPLETED
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      const result = await service.getSession('123456');
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update status in both DB and Redis', async () => {
      const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.WAITING,
        quizTitle: 'Test'
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      await service.updateStatus('123456', SessionStatus.IN_PROGRESS);

      expect(prismaMock.gameRoom.update).toHaveBeenCalledWith({
        where: { pin: '123456' },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date)
        }
      });
      
      expect(redisMock.set).toHaveBeenCalledWith(
        'session:123456' as any,
        expect.stringContaining('"status":"IN_PROGRESS"') as any,
        'EX' as any,
        7200 as any
      );
    });
  });

  describe('addPlayer', () => {
    it('should add player to session and update Redis', async () => {
      const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.WAITING,
        playerCount: 0,
        players: []
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      const player = { nickname: 'Player 1', socketId: 'socket-1', score: 0, lastActive: Date.now() };
      await service.addPlayer('123456', player);

      expect(redisMock.set).toHaveBeenCalledWith(
        'session:123456' as any,
        expect.stringContaining('"playerCount":1') as any,
        'EX' as any,
        7200 as any
      );
    });
  });

  describe('removePlayer', () => {
    it('should remove player from session and update Redis', async () => {
       const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.WAITING,
        playerCount: 1,
        players: [{ nickname: 'Player 1', socketId: 'socket-1' }]
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      await service.removePlayer('123456', 'socket-1');

      expect(redisMock.set).toHaveBeenCalledWith(
        'session:123456' as any,
        expect.stringContaining('"playerCount":0') as any,
        'EX' as any,
        7200 as any
      );
    });
  });

  describe('setMasterSocket', () => {
    it('should set master socket id and update Redis', async () => {
       const mockSession = { 
        id: 'room-1', 
        pin: '123456', 
        status: SessionStatus.WAITING
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockSession));

      await service.setMasterSocket('123456', 'master-socket-id');

      expect(redisMock.set).toHaveBeenCalledWith(
        'session:123456' as any,
        expect.stringContaining('"masterSocketId":"master-socket-id"') as any,
        'EX' as any,
        7200 as any
      );
    });
  });
});
