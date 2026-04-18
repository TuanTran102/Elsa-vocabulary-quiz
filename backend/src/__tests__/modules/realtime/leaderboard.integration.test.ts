import { jest, describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { QuizGateway } from '../../../modules/realtime/gateways/quiz.gateway.js';
import { disconnectRedis } from '../../../config/redis.js';

import { SessionStatus } from '../../../modules/session/session.types.js';

describe('Leaderboard Integration', () => {
  let io: Server;
  let server: any;
  let port: number;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let quizRepositoryMock: any;
  let quizAnswerServiceMock: any;
  let leaderboardServiceMock: any;
  let sessionServiceMock: any;
 
  beforeEach((done) => {
    server = createServer();
    io = new Server(server);
    
    quizRepositoryMock = {
      findById: jest.fn()
    };
    (quizRepositoryMock.findById as any).mockResolvedValue({ id: 'quiz_1' });
 
    quizAnswerServiceMock = {
      submitAnswer: jest.fn()
    };

    leaderboardServiceMock = {
      getLeaderboard: jest.fn()
    };

    sessionServiceMock = {
      createSession: jest.fn(),
      setMasterSocket: jest.fn(),
      getSession: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn()
    };
 
    new QuizGateway(io, quizRepositoryMock, quizAnswerServiceMock as any, leaderboardServiceMock as any, sessionServiceMock as any);

    server.listen(() => {
      port = (server.address() as any).port;
      
      let connections = 0;
      const onConnect = () => {
        connections++;
        if (connections === 2) done();
      };

      clientSocket1 = Client(`http://localhost:${port}/live-quiz`, {
        extraHeaders: { authorization: 'user_1' }
      });
      clientSocket1.on('connect', onConnect);

      clientSocket2 = Client(`http://localhost:${port}/live-quiz`, {
        extraHeaders: { authorization: 'user_2' }
      });
      clientSocket2.on('connect', onConnect);
    });
  });

  afterEach(async () => {
    clientSocket1.close();
    clientSocket2.close();
    io.close();
    if (server && server.listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
  
  afterAll(async () => {
    await disconnectRedis();
  });

  it('should broadcast leaderboard_update after throttled delay', (done) => {
    const pin = '123456';
    const quizId = 'quiz_1';
    const mockLeaderboard = [
      { username: 'User 1', score: 500 },
      { username: 'User 2', score: 300 }
    ];

    sessionServiceMock.getSession.mockResolvedValue({ pin, status: SessionStatus.WAITING, quizId });
    sessionServiceMock.addPlayer.mockResolvedValue(undefined);
    leaderboardServiceMock.getLeaderboard.mockResolvedValue(mockLeaderboard);
    quizAnswerServiceMock.submitAnswer.mockResolvedValue({ isCorrect: true, pointsAwarded: 500 });

    let updatesReceived = 0;
    const checkDone = () => {
      updatesReceived++;
      if (updatesReceived === 2) {
        done();
      }
    };

    clientSocket1.on('leaderboard_update', (data) => {
      expect(data).toEqual(mockLeaderboard);
      checkDone();
    });

    clientSocket2.on('leaderboard_update', (data) => {
      expect(data).toEqual(mockLeaderboard);
      checkDone();
    });

    // Join room first
    clientSocket1.on('join_confirmed', () => {
        clientSocket1.emit('submit_answer', { question_id: 'q1', answer: 'A' });
    });
    
    // We only need one to join and submit to trigger update for both
    clientSocket1.emit('join_quiz', { pin, nickname: 'User 1' });
    clientSocket2.emit('join_quiz', { pin, nickname: 'User 2' });
  }, 5000);

  it('should throttle multiple updates into one', (done) => {
    const pin = '123456';
    const quizId = 'quiz_1';
    const mockLeaderboard = [{ username: 'User 1', score: 1000 }];

    sessionServiceMock.getSession.mockResolvedValue({ pin, status: SessionStatus.WAITING, quizId });
    sessionServiceMock.addPlayer.mockResolvedValue(undefined);
    leaderboardServiceMock.getLeaderboard.mockResolvedValue(mockLeaderboard);
    quizAnswerServiceMock.submitAnswer.mockResolvedValue({ isCorrect: true, pointsAwarded: 500 });

    let updateCount = 0;
    clientSocket1.on('leaderboard_update', () => {
      updateCount++;
    });

    clientSocket1.on('join_confirmed', () => {
      // Multiple submissions
      clientSocket1.emit('submit_answer', { question_id: 'q1', answer: 'A' });
      clientSocket1.emit('submit_answer', { question_id: 'q2', answer: 'B' });
      
      // Wait for throttle (1s) + some buffer
      setTimeout(() => {
        expect(updateCount).toBe(1);
        expect(leaderboardServiceMock.getLeaderboard).toHaveBeenCalledTimes(1);
        done();
      }, 1500);
    });

    clientSocket1.emit('join_quiz', { pin, nickname: 'User 1' });
  }, 5000);
});
