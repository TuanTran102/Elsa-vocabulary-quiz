import { Server } from 'socket.io';
import { SessionService } from '../../session/session.service.js';
import { QuizRepository } from '../../quiz/repositories/quiz.repository.js';
import { LeaderboardService } from '../../quiz/services/leaderboard.service.js';
import { SessionStatus } from '../../session/session.types.js';
import type { PrismaClient } from '@prisma/client';

export class GameFlowService {
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private io: Server,
    private sessionService: SessionService,
    private quizRepository: QuizRepository,
    private leaderboardService: LeaderboardService,
    private prisma: PrismaClient
  ) {}

  async startQuiz(pin: string) {
    const session = await this.sessionService.getSession(pin);
    if (!session) throw new Error('Session not found');
    if (session.status !== SessionStatus.WAITING) throw new Error('Quiz already started');
    if (session.playerCount === 0) throw new Error('No players in room');

    const quiz = await this.quizRepository.findByIdWithAnswers(session.quizId);
    if (!quiz) throw new Error('Quiz not found');

    await this.sessionService.updateStatus(pin, SessionStatus.IN_PROGRESS);
    
    // Update DB startedAt and status
    await this.prisma.gameRoom.update({
      where: { id: session.id },
      data: { startedAt: new Date(), status: 'IN_PROGRESS' }
    });

    const totalQuestions = quiz.questions.length;
    await this.sessionService.updateSession(pin, { totalQuestions });

    this.io.of('/live-quiz').to(pin).emit('quiz_started', { total_questions: totalQuestions });
    
    // Wait 2 seconds for players to navigate to the play page before sending first question
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startQuestion(pin, 0);
  }

  async startQuestion(pin: string, index: number) {
    const session = await this.sessionService.getSession(pin);
    if (!session || session.status !== SessionStatus.IN_PROGRESS) return;

    const quiz = await this.quizRepository.findByIdWithAnswers(session.quizId);
    if (!quiz || !quiz.questions[index]) {
      await this.endQuiz(pin);
      return;
    }

    const question = quiz.questions[index];
    const questionStartedAt = Date.now();

    await this.sessionService.updateSession(pin, {
      currentQuestionIndex: index,
      questionStartedAt
    });

    this.io.of('/live-quiz').to(pin).emit('question_started', {
      question_id: question.id,
      text: question.content,
      options: question.options,
      time_limit: question.timeLimitSeconds,
      question_number: index + 1,
      total: quiz.questions.length
    });

    // Schedule question ending
    this.clearTimer(pin);
    const timer = setTimeout(() => {
      this.endQuestion(pin, index);
    }, (question.timeLimitSeconds as number) * 1000);

    this.timers.set(pin, timer);
  }

  async endQuestion(pin: string, index: number) {
    this.clearTimer(pin);

    const session = await this.sessionService.getSession(pin);
    if (!session) return;

    const quiz = await this.quizRepository.findByIdWithAnswers(session.quizId);
    const question = quiz?.questions[index];
    if (!question) return;

    const distribution = await this.sessionService.getAnswerDistribution(pin, question.id);

    this.io.of('/live-quiz').to(pin).emit('question_ended', {
      correct_answer: question.correctAnswer,
      answer_distribution: distribution
    });

    // Cooldown 3 seconds before next question or ending quiz
    const timer = setTimeout(() => {
      if (index + 1 < (quiz?.questions.length || 0)) {
        this.startQuestion(pin, index + 1);
      } else {
        this.endQuiz(pin);
      }
    }, 3000);

    this.timers.set(pin, timer);
  }

  async endQuiz(pin: string) {
    this.clearTimer(pin);
    
    const session = await this.sessionService.getSession(pin);
    if (!session || session.status === SessionStatus.COMPLETED) return;

    await this.sessionService.updateStatus(pin, SessionStatus.COMPLETED);
    
    // Update DB completedAt and status
    await this.prisma.gameRoom.update({
      where: { id: session.id },
      data: { completedAt: new Date(), status: 'COMPLETED' }
    });

    const leaderboard = await this.leaderboardService.getLeaderboard(session.pin);
    
    // Persist final results
    const players = session.players || [];
    if (players.length > 0) {
      await this.prisma.playerResult.createMany({
        data: players.map(p => ({
          gameRoomId: session.id,
          nickname: p.nickname,
          finalScore: p.score,
          completedAt: new Date()
        }))
      });
    }

    this.io.of('/live-quiz').to(pin).emit('quiz_completed', { final_leaderboard: leaderboard });
  }

  private clearTimer(pin: string) {
    const timer = this.timers.get(pin);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(pin);
    }
  }
}
