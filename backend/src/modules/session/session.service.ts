import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { SessionStatus, type GameSession } from './session.types.js';

export class SessionService {
  private readonly SESSION_TTL = 7200; // 2 hours

  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis
  ) {}

  async createSession(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { title: true }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const pin = await this.generateUniquePin();

    const gameRoom = await this.prisma.gameRoom.create({
      data: {
        pin,
        quizId,
        status: 'WAITING'
      }
    });

    const session: GameSession = {
      id: gameRoom.id,
      pin,
      quizId,
      quizTitle: quiz.title,
      status: SessionStatus.WAITING,
      playerCount: 0
    };

    await this.redis.set(
      `session:${pin}`,
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL
    );

    return {
      pin,
      gameRoomId: gameRoom.id,
      quizTitle: quiz.title
    };
  }

  async getSession(pin: string): Promise<GameSession | null> {
    const cached = await this.redis.get(`session:${pin}`);
    if (cached) {
      const session = JSON.parse(cached) as GameSession;
      if (session.status === SessionStatus.COMPLETED) {
        return null;
      }
      return session;
    }

    // Fallback to DB
    const gameRoom = await this.prisma.gameRoom.findUnique({
      where: { pin },
      include: {
        quiz: {
          select: { title: true }
        },
        _count: {
          select: { results: true }
        }
      }
    });

    if (!gameRoom || gameRoom.status === 'COMPLETED') {
      return null;
    }

    const session: GameSession = {
      id: gameRoom.id,
      pin: gameRoom.pin,
      quizId: gameRoom.quizId,
      quizTitle: gameRoom.quiz.title,
      status: gameRoom.status as SessionStatus,
      playerCount: gameRoom._count.results
    };

    // Re-populate cache
    await this.redis.set(
      `session:${pin}`,
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL
    );

    return session;
  }

  async updateStatus(pin: string, status: SessionStatus) {
    const session = await this.getSession(pin);
    if (!session) {
      throw new Error('Session not found');
    }

    const updateData: any = { status };
    if (status === SessionStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    } else if (status === SessionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.prisma.gameRoom.update({
      where: { pin },
      data: updateData
    });

    session.status = status;
    await this.redis.set(
      `session:${pin}`,
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL
    );
  }

  private async generateUniquePin(): Promise<string> {
    let pin = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.redis.exists(`session:${pin}`);
      if (!exists) {
        return pin;
      }
      attempts++;
    }

    throw new Error('Failed to generate a unique PIN');
  }
}
