import { Router } from 'express';
import { QuizController } from './controllers/quiz.controller.js';
import { QuizService } from './services/quiz.service.js';
import { QuizRepository } from './repositories/quiz.repository.js';
import prisma from '../../config/db.js';

const router = Router();

// Dependency Injection
const quizRepository = new QuizRepository(prisma);
const quizService = new QuizService(quizRepository);
const quizController = new QuizController(quizService);

// Routes
router.get('/', quizController.index);
router.get('/:id', quizController.show);

export default router;
