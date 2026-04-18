import { Server, Socket } from 'socket.io';
import { socketMiddleware } from './socket.middleware.js';
import { QuizRepository } from '../quiz/repositories/quiz.repository.js';
import { QuizAnswerService } from '../quiz/services/quiz-answer.service.js';

export class QuizGateway {
  constructor(
    private io: Server,
    private quizRepository: QuizRepository,
    private quizAnswerService: QuizAnswerService
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
}
