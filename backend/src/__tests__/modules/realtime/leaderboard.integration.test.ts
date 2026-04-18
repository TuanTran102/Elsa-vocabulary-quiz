import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { QuizGateway } from '../../../modules/realtime/quiz.gateway.js';
import { disconnectRedis } from '../../../config/redis.js';

describe('Leaderboard Integration', () => {
  let io: Server;
  let server: any;
  let port: number;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let quizRepositoryMock: any;
  let quizAnswerServiceMock: any;
  let leaderboardServiceMock: any;
 
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
 
    new QuizGateway(io, quizRepositoryMock, quizAnswerServiceMock as any, leaderboardServiceMock as any);

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
    const quizId = 'quiz_1';
    const mockLeaderboard = [
      { username: 'User 1', score: 500 },
      { username: 'User 2', score: 300 }
    ];

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
    clientSocket1.emit('join_quiz', { quiz_id: quizId });
    clientSocket2.emit('join_quiz', { quiz_id: quizId });

    // Wait a bit for joins to complete, then submit answer
    setTimeout(() => {
      clientSocket1.emit('submit_answer', { quiz_id: quizId, question_id: 'q1', answer: 'A' });
    }, 100);
  }, 5000);

  it('should throttle multiple updates into one', (done) => {
    const quizId = 'quiz_1';
    const mockLeaderboard = [{ username: 'User 1', score: 1000 }];

    leaderboardServiceMock.getLeaderboard.mockResolvedValue(mockLeaderboard);
    quizAnswerServiceMock.submitAnswer.mockResolvedValue({ isCorrect: true, pointsAwarded: 500 });

    let updateCount = 0;
    clientSocket1.on('leaderboard_update', () => {
      updateCount++;
    });

    clientSocket1.emit('join_quiz', { quiz_id: quizId });

    setTimeout(() => {
      // Multiple submissions
      clientSocket1.emit('submit_answer', { quiz_id: quizId, question_id: 'q1', answer: 'A' });
      clientSocket1.emit('submit_answer', { quiz_id: quizId, question_id: 'q2', answer: 'B' });
      
      // Wait for throttle (1s) + some buffer
      setTimeout(() => {
        expect(updateCount).toBe(1);
        expect(leaderboardServiceMock.getLeaderboard).toHaveBeenCalledTimes(1);
        done();
      }, 1500);
    }, 100);
  }, 5000);
});
