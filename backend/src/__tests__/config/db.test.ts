import { PrismaClient } from '@prisma/client';

describe('Database Configuration and Models', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    // This will fail if the database is not running
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });

  it('should verify the GameRoom model exists and can be queried', async () => {
    const gameRoomCount = await prisma.gameRoom.count();
    expect(typeof gameRoomCount).toBe('number');
  });

  it('should verify the Quiz model exists and has 1 record from seeding', async () => {
    const quizCount = await prisma.quiz.count();
    expect(quizCount).toBeGreaterThanOrEqual(1);
    
    const quiz = await prisma.quiz.findFirst({
      where: { title: 'English Essentials' }
    });
    expect(quiz).toBeDefined();
    expect(quiz?.title).toBe('English Essentials');
  });

  it('should verify that Question model has 10 records linked to the quiz', async () => {
    const quiz = await prisma.quiz.findFirst({
      where: { title: 'English Essentials' },
      include: { _count: { select: { questions: true } } }
    });
    
    expect(quiz?._count.questions).toBe(10);
  });
});
