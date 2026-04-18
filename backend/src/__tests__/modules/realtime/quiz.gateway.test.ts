import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { QuizGateway } from '../../../modules/realtime/gateways/quiz.gateway.js';
import { disconnectRedis } from '../../../config/redis.js';

import { SessionStatus } from '../../../modules/session/session.types.js';

describe('QuizGateway', () => {
  let io: Server;
  let server: any;
  let port: number;
  let clientSocket: ClientSocket;
  let quizRepositoryMock: any;
  let quizAnswerServiceMock: any;
  let sessionServiceMock: any;
 
  beforeEach((done) => {
    server = createServer();
    io = new Server(server);
    
    quizRepositoryMock = {
      findById: jest.fn()
    };
 
    quizAnswerServiceMock = {
      submitAnswer: jest.fn()
    };

    const leaderboardServiceMock = {
      getLeaderboard: jest.fn()
    };

    sessionServiceMock = {
      createSession: jest.fn(),
      setMasterSocket: jest.fn(),
      getSession: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn()
    };

    const gameFlowServiceMock = {
      startQuiz: jest.fn()
    };
  
    new QuizGateway(io, quizRepositoryMock, quizAnswerServiceMock as any, leaderboardServiceMock as any, sessionServiceMock as any, gameFlowServiceMock as any);

    server.listen(() => {
      port = (server.address() as any).port;
      clientSocket = Client(`http://localhost:${port}/live-quiz`, {
        extraHeaders: {
          authorization: 'user_123'
        }
      });
      clientSocket.on('connect', done);
    });
  });

  afterEach(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    if (io) {
      io.close();
    }
    if (server && server.listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
  
  afterAll(async () => {
    await disconnectRedis();
  });

  it('should create a quiz session (master flow)', (done) => {
    const quizId = 'quiz_123';
    const mockSession = { pin: '123456', gameRoomId: 'room_1', quizTitle: 'Test Quiz' };
    sessionServiceMock.createSession.mockResolvedValue(mockSession);
    sessionServiceMock.setMasterSocket.mockResolvedValue(undefined);

    clientSocket.on('session_created', (data) => {
      expect(data.pin).toBe('123456');
      expect(data.quiz_title).toBe('Test Quiz');
      done();
    });

    clientSocket.emit('create_quiz_session', { quiz_id: quizId });
  });

  it('should join a quiz using PIN (player flow)', (done) => {
    const pin = '123456';
    const nickname = 'Player 1';
    const mockSession = { pin, status: SessionStatus.WAITING, players: [] };
    sessionServiceMock.getSession.mockResolvedValue(mockSession);
    sessionServiceMock.addPlayer.mockResolvedValue(undefined);

    clientSocket.on('join_confirmed', (data) => {
      expect(data.nickname).toBe(nickname);
      expect(data.playerId).toBeDefined();
      done();
    });

    clientSocket.emit('join_quiz', { pin, nickname });
  });

  it('should handle submit_answer and emit answer_status', (done) => {
    const quizId = 'quiz_123';
    const questionId = 'question_1';
    const answer = 'Paris';
    const mockResult = { isCorrect: true, pointsAwarded: 500 };
    const mockSession = { pin: '123456', gameRoomId: 'room_1', quizTitle: 'Test Quiz', quizId };

    sessionServiceMock.createSession.mockResolvedValue(mockSession);
    sessionServiceMock.getSession.mockResolvedValue(mockSession);
    quizAnswerServiceMock.submitAnswer.mockResolvedValue(mockResult);

    clientSocket.on('session_created', () => {
      clientSocket.emit('submit_answer', { question_id: questionId, answer });
    });

    clientSocket.on('answer_status', (data) => {
      expect(data.success).toBe(true);
      expect(data.is_correct).toBe(true);
      expect(data.points_awarded).toBe(500);
      done();
    });

    // We join as master for simplicity as that sets pin and playerId is not needed for master?
    // Wait, master doesn't have playerId in the current implementation of join_quiz.
    // Actually, submit_answer checks for playerId.
    // Let's join as player.
    const pin = '123456';
    const nickname = 'Player 1';
    sessionServiceMock.getSession.mockResolvedValue({ pin, status: SessionStatus.WAITING, quizId });
    sessionServiceMock.addPlayer.mockResolvedValue(undefined);

    clientSocket.on('join_confirmed', () => {
      clientSocket.emit('submit_answer', { question_id: questionId, answer });
    });

    clientSocket.emit('join_quiz', { pin, nickname });
  });
});
