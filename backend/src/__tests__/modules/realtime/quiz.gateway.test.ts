import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { QuizGateway } from '../../../modules/realtime/quiz.gateway.js';

describe('QuizGateway', () => {
  let io: Server;
  let server: any;
  let port: number;
  let clientSocket: ClientSocket;
  let quizRepositoryMock: any;

  beforeEach((done) => {
    server = createServer();
    io = new Server(server);
    
    quizRepositoryMock = {
      findById: jest.fn()
    };

    new QuizGateway(io, quizRepositoryMock);

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

  afterEach(() => {
    io.close();
    clientSocket.close();
    server.close();
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
});
