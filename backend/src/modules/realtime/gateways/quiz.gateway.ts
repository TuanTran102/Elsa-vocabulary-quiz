import { Server, Socket } from 'socket.io';
import { socketMiddleware } from '../socket.middleware.js';
import { QuizRepository } from '../../quiz/repositories/quiz.repository.js';
import { QuizAnswerService } from '../../quiz/services/quiz-answer.service.js';
import { LeaderboardService } from '../../quiz/services/leaderboard.service.js';
import { SessionService } from '../../session/session.service.js';
import { GameFlowService } from '../services/game-flow.service.js';
import { SessionStatus } from '../../session/session.types.js';
import { MasterGuard } from '../guards/master.guard.js';
import crypto from 'crypto';

export class QuizGateway {
  private leaderboardThrottles = new Map<string, boolean>();

  constructor(
    private io: Server,
    private quizRepository: QuizRepository,
    private quizAnswerService: QuizAnswerService,
    private leaderboardService: LeaderboardService,
    private sessionService: SessionService,
    private gameFlowService: GameFlowService
  ) {
    const liveQuizNamespace = this.io.of('/live-quiz');
    
    liveQuizNamespace.use(socketMiddleware);
    
    liveQuizNamespace.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket) {
    // Master Flow
    socket.on('create_quiz_session', async (data: { quiz_id: string }) => {
      const { quiz_id } = data;
      try {
        const session = await this.sessionService.createSession(quiz_id);
        await this.sessionService.setMasterSocket(session.pin, socket.id);
        
        socket.data.role = 'master';
        socket.data.pin = session.pin;
        socket.data.gameRoomId = session.gameRoomId;
        
        await socket.join(session.pin);
        
        socket.emit('session_created', {
          pin: session.pin,
          game_room_id: session.gameRoomId,
          quiz_title: session.quizTitle
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('reclaim_host', async (data: { pin: string, masterToken: string }) => {
      const { pin, masterToken } = data;
      try {
        const session = await this.sessionService.getSession(pin);
        if (session && session.masterToken === masterToken) {
          await this.sessionService.setMasterSocket(pin, socket.id);
          socket.data.role = 'master';
          socket.data.pin = pin;
          socket.data.gameRoomId = session.id;
          await socket.join(pin);
          // Don't need to emit anything unless the frontend expects it,
          // but we can just be silent or emit 'host_reclaimed'
        } else {
          socket.emit('error', { message: 'Invalid master token or session' });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Player Flow
    socket.on('join_quiz', async (data: { pin: string, nickname: string }) => {
      const { pin, nickname } = data;
      try {
        const session = await this.sessionService.getSession(pin);
        if (!session) {
          return socket.emit('error', { message: 'Session not found' });
        }
        if (session.status === SessionStatus.COMPLETED) {
          return socket.emit('error', { message: 'Quiz already completed' });
        }

        const playerId = crypto.randomUUID();
        socket.data.role = 'player';
        socket.data.pin = pin;
        socket.data.playerId = playerId;
        socket.data.nickname = nickname;
        socket.data.gameRoomId = session.id;

        await socket.join(pin);
        await this.sessionService.addPlayer(pin, { 
          id: playerId,
          nickname, 
          socketId: socket.id, 
          score: 0, 
          lastActive: Date.now() 
        });

        const updatedSession = await this.sessionService.getSession(pin);
        const players = updatedSession?.players || [];

        socket.emit('join_confirmed', { playerId, nickname, players });
        socket.to(pin).emit('player_joined', { 
          id: playerId,
          nickname, 
          player_count: updatedSession?.playerCount || 0,
          players 
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Game Control Events (Master only)
    socket.on('start_quiz', async () => {
      if (await MasterGuard.isMaster(socket, this.sessionService)) {
        try {
          await this.gameFlowService.startQuiz(socket.data.pin);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      } else {
        socket.emit('error', { message: 'Unauthorized' });
      }
    });

    socket.on('end_quiz', async () => {
      if (await MasterGuard.isMaster(socket, this.sessionService)) {
        try {
          await this.gameFlowService.endQuiz(socket.data.pin);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      } else {
        socket.emit('error', { message: 'Unauthorized' });
      }
    });

    socket.on('submit_answer', async (data: { question_id: string, answer: string }) => {
      const { question_id, answer } = data;
      const { pin, playerId } = socket.data;

      if (!pin || !playerId) {
        return socket.emit('error', { message: 'Not joined to any session' });
      }

      try {
        const session = await this.sessionService.getSession(pin);
        if (!session) throw new Error('Session not found');

        const result = await this.quizAnswerService.submitAnswer(playerId, pin, question_id, answer);
        
        // Fetch latest stats for this player
        const totalScore = await this.leaderboardService.getPlayerScore(pin, playerId);
        const rank = await this.leaderboardService.getPlayerRank(pin, playerId);

        socket.emit('answer_result', {
          success: true,
          isCorrect: result.isCorrect,
          points: result.pointsAwarded,
          totalScore: totalScore,
          rank: rank
        });

        // Update distribution in real-time
        this.requestDistributionUpdate(pin, question_id);

        if (result.pointsAwarded > 0) {
          this.requestLeaderboardUpdate(pin);
        }
      } catch (error: any) {
        socket.emit('answer_result', {
          success: false,
          message: error.message
        });
      }
    });

    socket.on('disconnect', async () => {
      const { role, pin, nickname } = socket.data;
      if (role === 'master') {
        this.io.of('/live-quiz').to(pin).emit('host_disconnected');
      } else if (role === 'player') {
        await this.sessionService.removePlayer(pin, socket.id);
        this.io.of('/live-quiz').to(pin).emit('player_left', { nickname });
      }
    });
  }

  private requestLeaderboardUpdate(pin: string) {
    if (this.leaderboardThrottles.get(pin)) {
      return;
    }

    this.leaderboardThrottles.set(pin, true);

    setTimeout(async () => {
      try {
        const leaderboard = await this.leaderboardService.getLeaderboard(pin);
        this.io.of('/live-quiz').to(pin).emit('leaderboard_update', { leaderboard });
      } catch (error) {
        console.error('Error broadcasting leaderboard:', error);
      } finally {
        this.leaderboardThrottles.set(pin, false);
      }
    }, 1000);
  }

  private requestDistributionUpdate(pin: string, questionId: string) {
    // Throttle slightly to avoid too many emits if many players answer at once
    setTimeout(async () => {
      try {
        const distribution = await this.sessionService.getAnswerDistribution(pin, questionId);
        this.io.of('/live-quiz').to(pin).emit('answer_distribution_update', distribution);
      } catch (error) {
        console.error('Error broadcasting distribution:', error);
      }
    }, 500);
  }
}
