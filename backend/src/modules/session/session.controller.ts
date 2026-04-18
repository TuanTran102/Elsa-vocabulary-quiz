import type { Request, Response } from 'express';
import { SessionService } from './session.service.js';
import { QuizRepository } from '../quiz/repositories/quiz.repository.js';
import { LeaderboardService } from '../quiz/services/leaderboard.service.js';
import { SessionStatus } from './session.types.js';

export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly quizRepository: QuizRepository,
    private readonly leaderboardService: LeaderboardService
  ) {}

  async create(req: Request, res: Response) {
    try {
      const { quiz_id } = req.body;
      if (!quiz_id) {
        return res.status(400).json({ message: 'quiz_id is required' });
      }

      const result = await this.sessionService.createSession(quiz_id);

      return res.status(201).json({
        data: {
          session_id: result.gameRoomId,
          game_room_id: result.gameRoomId,
          pin: result.pin,
          quiz_title: result.quizTitle,
          master_token: result.masterToken
        }
      });
    } catch (error: any) {
      if (error.message === 'Quiz not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { pin } = req.params;
      if (!pin) {
        return res.status(400).json({ message: 'pin is required' });
      }
      const session = await this.sessionService.getSession(pin as string);

      if (!session) {
        return res.status(404).json({ message: 'Session not found or completed' });
      }

      let currentQuestion = null;
      if (session.status === SessionStatus.IN_PROGRESS && session.currentQuestionIndex !== undefined) {
        const quiz = await this.quizRepository.findById(session.quizId);
        if (quiz && quiz.questions[session.currentQuestionIndex]) {
          const q = quiz.questions[session.currentQuestionIndex];
          currentQuestion = {
            id: q.id,
            text: q.content,
            options: q.options,
            timeLimitSeconds: q.timeLimitSeconds
          };
        }
      }

      let leaderboard = [];
      if (session.status === SessionStatus.IN_PROGRESS || session.status === SessionStatus.COMPLETED) {
        leaderboard = await this.leaderboardService.getLeaderboard(session.pin);
      }

      return res.status(200).json({
        data: {
          game_room_id: session.id,
          quiz_title: session.quizTitle,
          status: session.status,
          player_count: session.playerCount,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.totalQuestions,
          questionStartedAt: session.questionStartedAt,
          currentQuestion,
          leaderboard
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
