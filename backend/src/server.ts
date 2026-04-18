import http from 'http';
import app from './app.js';
import { SocketServer } from './core/socket/socket.server.js';
import { QuizGateway } from './modules/realtime/quiz.gateway.js';
import { QuizRepository } from './modules/quiz/repositories/quiz.repository.js';
import prisma from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize SocketServer
const io = SocketServer.init(server);

// Initialize Gateways
const quizRepository = new QuizRepository(prisma);
new QuizGateway(io, quizRepository);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export { server, io };
