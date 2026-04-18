import type { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service.js';

export class QuizController {
  constructor(private quizService: QuizService) {}

  index = async (req: Request, res: Response) => {
    try {
      const quizzes = await this.quizService.getQuizzes();
      res.status(200).json({ data: quizzes });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  show = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const quiz = await this.quizService.getQuizById(id as string);
      res.status(200).json({ data: quiz });
    } catch (error: any) {
      if (error.message === 'Quiz not found') {
        res.status(404).json({ message: 'Quiz not found' });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  };
}
