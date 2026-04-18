import { Router } from 'express';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';
import prisma from '../../config/db.js';
import { pubClient } from '../../config/redis.js';

const router = Router();

// Dependency Injection
const sessionService = new SessionService(prisma, pubClient);
const sessionController = new SessionController(sessionService);

// Routes
router.post('/', (req, res) => sessionController.create(req, res));
router.get('/:pin', (req, res) => sessionController.show(req, res));

export default router;
