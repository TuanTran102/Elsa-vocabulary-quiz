import { Router } from 'express';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';
import { QuizRepository } from '../quiz/repositories/quiz.repository.js';
import { LeaderboardService } from '../quiz/services/leaderboard.service.js';
import { QuizRedisRepository } from '../quiz/repositories/quiz-redis.repository.js';
import prisma from '../../config/db.js';
import { pubClient } from '../../config/redis.js';

const router = Router();

// Dependency Injection
const quizRepository = new QuizRepository(prisma);
const quizRedisRepository = new QuizRedisRepository();
const leaderboardService = new LeaderboardService(quizRedisRepository);
const sessionService = new SessionService(prisma, pubClient);
const sessionController = new SessionController(sessionService, quizRepository, leaderboardService);

// Routes
router.post('/', (req, res) => sessionController.create(req, res));
router.get('/:pin', (req, res) => sessionController.show(req, res));

export default router;
