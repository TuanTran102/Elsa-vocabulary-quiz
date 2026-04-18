export enum SessionStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface PlayerSession {
  id: string;
  nickname: string;
  socketId: string;
  score: number;
  lastActive: number;
}

export interface GameSession {
  id: string; // This is the PostgreSQL GameRoom ID
  pin: string;
  quizId: string;
  quizTitle: string;
  status: SessionStatus;
  playerCount: number;
  masterSocketId?: string;
  players?: PlayerSession[];
  masterToken?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  questionStartedAt?: number;
}
