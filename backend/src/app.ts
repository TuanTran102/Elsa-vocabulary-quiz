import express from 'express';
import cors from 'cors';
import { dummyAuthMiddleware } from './core/middlewares/dummy-auth.middleware.js';
import quizRoutes from './modules/quiz/quiz.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(dummyAuthMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.use('/api/v1/quizzes', quizRoutes);

export default app;
