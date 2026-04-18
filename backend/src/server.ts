import http from 'http';
import app from './app.js';
import { SocketServer } from './core/socket/socket.server.js';
import { QuizGateway } from './modules/realtime/quiz.gateway.js';
import { QuizRepository } from './modules/quiz/repositories/quiz.repository.js';
import { QuizRedisRepository } from './modules/quiz/repositories/quiz-redis.repository.js';
import { ScoringService } from './modules/quiz/services/scoring.service.js';
import { QuizAnswerService } from './modules/quiz/services/quiz-answer.service.js';
import { LeaderboardService } from './modules/quiz/services/leaderboard.service.js';
import prisma from './config/db.js';
import dotenv from 'dotenv';
 
dotenv.config();
 
const port = process.env.PORT || 3000;
const server = http.createServer(app);
 
// Initialize SocketServer
const io = SocketServer.init(server);
 
// Initialize Dependencies
const quizRepository = new QuizRepository(prisma);
const quizRedisRepository = new QuizRedisRepository();
const scoringService = new ScoringService();
const leaderboardService = new LeaderboardService(prisma, quizRedisRepository);
const quizAnswerService = new QuizAnswerService(
  quizRedisRepository,
  scoringService,
  quizRepository,
  prisma,
  leaderboardService
);

// Initialize Gateways
new QuizGateway(io, quizRepository, quizAnswerService, leaderboardService);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export { server, io };
