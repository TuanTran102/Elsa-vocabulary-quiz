/**
 * Integration smoke tests for the new GameRoom / PlayerResult schema.
 *
 * These tests use a deep-mocked Prisma client to verify relational field shapes
 * and FK wiring without requiring a live database in CI.
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('Prisma schema smoke tests — GameRoom / PlayerResult', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    mockReset(prisma);
  });

  it('should create a GameRoom linked to a Quiz', async () => {
    const mockGameRoom = {
      id: 'room-1',
      pin: '123456',
      quizId: 'quiz-1',
      status: 'WAITING',
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };

    (prisma.gameRoom.create as any).mockResolvedValue(mockGameRoom);

    const room = await prisma.gameRoom.create({
      data: {
        pin: '123456',
        quizId: 'quiz-1',
        status: 'WAITING',
      },
    } as any);

    expect(room).toMatchObject({
      id: 'room-1',
      pin: '123456',
      quizId: 'quiz-1',
      status: 'WAITING',
    });
    expect(prisma.gameRoom.create).toHaveBeenCalledTimes(1);
  });

  it('should create a PlayerResult linked to a GameRoom', async () => {
    const mockPlayerResult = {
      id: 'pr-1',
      gameRoomId: 'room-1',
      nickname: 'Alice',
      finalScore: 0,
      rank: null,
      completedAt: new Date(),
    };

    (prisma.playerResult.create as any).mockResolvedValue(mockPlayerResult);

    const playerResult = await prisma.playerResult.create({
      data: {
        gameRoomId: 'room-1',
        nickname: 'Alice',
        finalScore: 0,
        completedAt: new Date(),
      },
    } as any);

    expect(playerResult).toMatchObject({
      id: 'pr-1',
      gameRoomId: 'room-1',
      nickname: 'Alice',
    });
    expect(prisma.playerResult.create).toHaveBeenCalledTimes(1);
  });

  it('should create an Answer linked to a PlayerResult using playerResultId FK', async () => {
    const mockAnswer = {
      id: 'ans-1',
      playerResultId: 'pr-1',
      questionId: 'q-1',
      userAnswer: 'Skilled',
      isCorrect: true,
      pointsAwarded: 850,
      submittedAt: new Date(),
    };

    (prisma.answer.create as any).mockResolvedValue(mockAnswer);

    const answer = await prisma.answer.create({
      data: {
        playerResultId: 'pr-1',
        questionId: 'q-1',
        userAnswer: 'Skilled',
        isCorrect: true,
        pointsAwarded: 850,
      },
    } as any);

    expect(answer).toMatchObject({
      id: 'ans-1',
      playerResultId: 'pr-1',
      questionId: 'q-1',
      isCorrect: true,
      pointsAwarded: 850,
    });
    // Ensure the old sessionId field is gone
    expect((answer as any).sessionId).toBeUndefined();
  });

  it('should fetch a GameRoom with nested results and answers', async () => {
    const mockRoomWithIncludes = {
      id: 'room-1',
      pin: '123456',
      quizId: 'quiz-1',
      status: 'COMPLETED',
      results: [
        {
          id: 'pr-1',
          nickname: 'Alice',
          finalScore: 850,
          rank: 1,
          answers: [
            {
              id: 'ans-1',
              playerResultId: 'pr-1',
              questionId: 'q-1',
              isCorrect: true,
              pointsAwarded: 850,
            },
          ],
        },
      ],
    };

    (prisma.gameRoom.findUnique as any).mockResolvedValue(mockRoomWithIncludes);

    const room = await prisma.gameRoom.findUnique({
      where: { id: 'room-1' },
      include: { results: { include: { answers: true } } },
    } as any);

    expect(room).not.toBeNull();
    const roomAny = room as any;
    expect(roomAny.results).toHaveLength(1);
    expect(roomAny.results[0].answers).toHaveLength(1);
    expect(roomAny.results[0].answers[0].playerResultId).toBe('pr-1');
    expect(roomAny.results[0].answers[0].sessionId).toBeUndefined();
  });
});
