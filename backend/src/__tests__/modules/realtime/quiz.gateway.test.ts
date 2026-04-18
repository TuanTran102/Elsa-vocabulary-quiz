import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { QuizGateway } from '../../../modules/realtime/quiz.gateway.js';
import { disconnectRedis } from '../../../config/redis.js';

describe('QuizGateway', () => {
  let io: Server;
  let server: any;
  let port: number;
  let clientSocket: ClientSocket;
  let quizRepositoryMock: any;
  let quizAnswerServiceMock: any;
 
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
 
    new QuizGateway(io, quizRepositoryMock, quizAnswerServiceMock as any, leaderboardServiceMock as any);

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

  it('should join quiz room and emit quiz_joined', (done) => {
    const quizId = 'quiz_123';
    quizRepositoryMock.findById.mockResolvedValue({ id: quizId });

    clientSocket.on('quiz_joined', (data) => {
      expect(data.quiz_id).toBe(quizId);
      done();
    });

    clientSocket.emit('join_quiz', { quiz_id: quizId });
  });

  it('should broadcast participant_joined when someone joins', (done) => {
    const quizId = 'quiz_123';
    quizRepositoryMock.findById.mockResolvedValue({ id: quizId });

    const clientSocket2 = Client(`http://localhost:${port}/live-quiz`, {
      extraHeaders: {
        authorization: 'user_456'
      }
    });

    clientSocket.on('participant_joined', (data) => {
      if (data.total_participants === 2) {
        clientSocket2.close();
        done();
      }
    });

    clientSocket.on('quiz_joined', () => {
      clientSocket2.emit('join_quiz', { quiz_id: quizId });
    });

    clientSocket.emit('join_quiz', { quiz_id: quizId });
  });

  it('should handle submit_answer and emit answer_status', (done) => {
    const quizId = 'quiz_123';
    const questionId = 'question_1';
    const answer = 'Paris';
    const mockResult = { isCorrect: true, pointsAwarded: 500 };

    quizAnswerServiceMock.submitAnswer.mockResolvedValue(mockResult);

    clientSocket.on('answer_status', (data) => {
      expect(data.success).toBe(true);
      expect(data.is_correct).toBe(true);
      expect(data.points_awarded).toBe(500);
      done();
    });

    clientSocket.emit('submit_answer', { quiz_id: quizId, question_id: questionId, answer });
  });
});
