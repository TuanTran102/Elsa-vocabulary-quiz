import { PrismaClient } from '@prisma/client';

export class QuizRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: { questions: true }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            content: true,
            options: true,
            points: true,
            timeLimitSeconds: true
          }
        }
      }
    });
  }

  async findByIdWithAnswers(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true
      }
    });
  }

  async findQuestionById(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
    });
  }
}
