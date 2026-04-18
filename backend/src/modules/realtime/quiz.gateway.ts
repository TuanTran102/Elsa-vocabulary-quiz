import { Server, Socket } from 'socket.io';
import { socketMiddleware } from './socket.middleware.js';
import { QuizRepository } from '../quiz/repositories/quiz.repository.js';
import { QuizAnswerService } from '../quiz/services/quiz-answer.service.js';
import { LeaderboardService } from '../quiz/services/leaderboard.service.js';

export class QuizGateway {
  private leaderboardThrottles = new Map<string, boolean>();

  constructor(
    private io: Server,
    private quizRepository: QuizRepository,
    private quizAnswerService: QuizAnswerService,
    private leaderboardService: LeaderboardService
  ) {
    const liveQuizNamespace = this.io.of('/live-quiz');
    
    liveQuizNamespace.use(socketMiddleware);
    
    liveQuizNamespace.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket) {
    socket.on('join_quiz', async (data: { quiz_id: string }) => {
      const { quiz_id } = data;
      
      try {
        const quiz = await this.quizRepository.findById(quiz_id);

        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        const roomName = `quiz_${quiz_id}`;
        await socket.join(roomName);

        socket.emit('quiz_joined', { quiz_id });

        const ns = this.io.of('/live-quiz');
        const room = ns.adapter.rooms.get(roomName);
        const totalParticipants = room ? room.size : 0;

        ns.to(roomName).emit('participant_joined', {
          userId: socket.data.user_id,
          total_participants: totalParticipants
        });
      } catch (error) {
        console.error('Error in join_quiz:', error);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    socket.on('submit_answer', async (data: { quiz_id: string, question_id: string, answer: string }) => {
      const { quiz_id, question_id, answer } = data;
      const user_id = socket.data.user_id;

      try {
        const result = await this.quizAnswerService.submitAnswer(user_id, quiz_id, question_id, answer);
        socket.emit('answer_status', {
          success: true,
          is_correct: result.isCorrect,
          points_awarded: result.pointsAwarded
        });

        if (result.pointsAwarded > 0) {
          this.requestLeaderboardUpdate(quiz_id);
        }
      } catch (error: any) {
        socket.emit('answer_status', {
          success: false,
          message: error.message
        });
      }
    });

    socket.on('disconnect', () => {
      // Logic for participant leaving can be added here
    });
  }

  private requestLeaderboardUpdate(quizId: string) {
    if (this.leaderboardThrottles.get(quizId)) {
      return;
    }

    this.leaderboardThrottles.set(quizId, true);

    setTimeout(async () => {
      try {
        const leaderboard = await this.leaderboardService.getLeaderboard(quizId);
        const roomName = `quiz_${quizId}`;
        this.io.of('/live-quiz').to(roomName).emit('leaderboard_update', leaderboard);
      } catch (error) {
        console.error('Error broadcasting leaderboard:', error);
      } finally {
        this.leaderboardThrottles.set(quizId, false);
      }
    }, 1000);
  }
}
