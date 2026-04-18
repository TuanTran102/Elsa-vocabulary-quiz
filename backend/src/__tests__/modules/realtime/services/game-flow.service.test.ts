import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameFlowService } from '../../../../modules/realtime/services/game-flow.service.js';
import { SessionStatus } from '../../../../modules/session/session.types.js';

describe('GameFlowService', () => {
  let ioMock: any;
  let sessionServiceMock: any;
  let quizRepositoryMock: any;
  let leaderboardServiceMock: any;
  let prismaMock: any;
  let redisRepoMock: any;
  let service: GameFlowService;
  let emitMock: any;
  let toMock: any;
  let sessionStore: Map<string, any>;

  beforeEach(() => {
    jest.useFakeTimers();

    emitMock = jest.fn();
    toMock = jest.fn().mockReturnValue({ emit: emitMock });
    ioMock = {
      of: jest.fn().mockReturnValue({ to: toMock })
    };

    sessionStore = new Map<string, any>();
    sessionServiceMock = {
      getSession: jest.fn().mockImplementation(async (pin: any) => sessionStore.get(pin)),
      updateStatus: jest.fn().mockImplementation(async (pin: any, status: any) => {
        const s = sessionStore.get(pin);
        if (s) s.status = status;
      }),
      updateSession: jest.fn().mockImplementation(async (pin: any, data: any) => {
        const s = sessionStore.get(pin);
        if (s) Object.assign(s, data);
      }),
      getAnswerDistribution: jest.fn(),
      // Add a helper to pre-populate store in tests
      _setSession: (pin: string, session: any) => sessionStore.set(pin, session)
    };

    quizRepositoryMock = {
      findByIdWithAnswers: jest.fn()
    };

    leaderboardServiceMock = {
      getLeaderboard: jest.fn()
    };

    prismaMock = {
      $transaction: jest.fn().mockImplementation(async (promises: any) => Promise.all(promises)),
      gameRoom: {
        update: jest.fn()
      },
      playerResult: {
        createMany: jest.fn(),
        updateMany: jest.fn()
      }
    };

    redisRepoMock = {
      setQuestionStartTime: jest.fn()
    };
  
    service = new GameFlowService(
      ioMock,
      sessionServiceMock,
      quizRepositoryMock,
      leaderboardServiceMock,
      prismaMock,
      redisRepoMock
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startQuiz', () => {
    it('should fail if session not found', async () => {
      sessionServiceMock.getSession.mockResolvedValue(null);
      await expect(service.startQuiz('123456')).rejects.toThrow('Session not found');
    });

    it('should fail if room is empty', async () => {
      sessionServiceMock.getSession.mockResolvedValue({
        status: SessionStatus.WAITING,
        playerCount: 0
      });
      await expect(service.startQuiz('123456')).rejects.toThrow('No players in room');
    });

    it('should succeed and broadcast quiz_started and start first question', async () => {
      jest.useRealTimers();
      const pin = '123456';
      const quizId = 'quiz_1';
      const session = { id: 'room_1', pin, quizId, status: SessionStatus.WAITING, playerCount: 1 };
      const quiz = {
        id: quizId,
        questions: [
          { id: 'q1', content: 'Q1', options: [], timeLimitSeconds: 10, correctAnswer: 'A' },
          { id: 'q2', content: 'Q2', options: [], timeLimitSeconds: 10, correctAnswer: 'B' }
        ]
      };

      sessionServiceMock._setSession(pin, session);
      quizRepositoryMock.findByIdWithAnswers.mockResolvedValue(quiz);

      await service.startQuiz(pin);

      expect(sessionServiceMock.updateStatus).toHaveBeenCalledWith(pin, SessionStatus.IN_PROGRESS);
      expect(prismaMock.gameRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'room_1' },
        data: expect.objectContaining({ status: 'IN_PROGRESS' })
      }));
      expect(emitMock).toHaveBeenCalledWith('quiz_started', { total_questions: 2 });
      
      // Should also start first question
      expect(emitMock).toHaveBeenCalledWith('question_started', expect.objectContaining({
        question_id: 'q1',
        question_number: 1
      }));
      jest.useFakeTimers();
    }, 20000);
  });

  describe('game loop flow', () => {
    it('should advance from question 1 to question 2 and then end', async () => {
      const pin = '123456';
      const quizId = 'quiz_1';
      const session = { id: 'room_1', pin, quizId, status: SessionStatus.IN_PROGRESS, playerCount: 1, players: [] };
      const quiz = {
        id: quizId,
        questions: [
          { id: 'q1', content: 'Q1', options: [], timeLimitSeconds: 10, correctAnswer: 'A' },
          { id: 'q2', content: 'Q2', options: [], timeLimitSeconds: 10, correctAnswer: 'B' }
        ]
      };

      sessionServiceMock._setSession(pin, session);
      quizRepositoryMock.findByIdWithAnswers.mockResolvedValue(quiz);
      sessionServiceMock.getAnswerDistribution.mockResolvedValue({ 'A': 1 });
      leaderboardServiceMock.getLeaderboard.mockResolvedValue([]);

      await service.startQuestion(pin, 0);
      expect(emitMock).toHaveBeenCalledWith('question_started', expect.objectContaining({ question_id: 'q1' }));

      // Fast-forward 10s for question 1 to end
      jest.advanceTimersByTime(10000);
      // Wait for multiple awaits in endQuestion
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(emitMock).toHaveBeenCalledWith('question_ended', expect.objectContaining({ correct_answer: 'A' }));

      // Fast-forward 3s cooldown
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      
      expect(emitMock).toHaveBeenCalledWith('question_started', expect.objectContaining({ question_id: 'q2' }));

      // Fast-forward 10s for question 2 to end
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(emitMock).toHaveBeenCalledWith('question_ended', expect.objectContaining({ correct_answer: 'B' }));

      // Fast-forward 3s cooldown -> endQuiz
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(emitMock).toHaveBeenCalledWith('quiz_completed', expect.any(Object));
      expect(sessionServiceMock.updateStatus).toHaveBeenCalledWith(pin, SessionStatus.COMPLETED);
    });
  });

  describe('endQuiz', () => {
    it('should update status and persist results', async () => {
      const pin = '123456';
      const session = { 
        id: 'room_1', 
        pin, 
        status: SessionStatus.IN_PROGRESS, 
        players: [{ nickname: 'P1', score: 100 }] 
      };
      sessionServiceMock._setSession(pin, session);
      leaderboardServiceMock.getLeaderboard.mockResolvedValue([{ nickname: 'P1', score: 100 }]);

      await service.endQuiz(pin);

      expect(sessionServiceMock.updateStatus).toHaveBeenCalledWith(pin, SessionStatus.COMPLETED);
      expect(prismaMock.gameRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED' })
      }));
      expect(prismaMock.playerResult.updateMany).toHaveBeenCalledWith({
        where: { 
          gameRoomId: 'room_1', 
          nickname: 'P1' 
        },
        data: {
          finalScore: 100,
          completedAt: expect.any(Date)
        }
      });
      expect(emitMock).toHaveBeenCalledWith('quiz_completed', expect.objectContaining({
        final_leaderboard: [{ nickname: 'P1', score: 100 }]
      }));
    });
  });
});
