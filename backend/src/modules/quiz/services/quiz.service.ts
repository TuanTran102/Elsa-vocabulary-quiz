import { QuizRepository } from '../repositories/quiz.repository.js';

export class QuizService {
  constructor(private quizRepository: QuizRepository) {}

  async getQuizzes() {
    const quizzes = await this.quizRepository.findAll();
    return quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      questions_count: quiz._count.questions
    }));
  }

  async getQuizById(id: string) {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions
    };
  }
}
