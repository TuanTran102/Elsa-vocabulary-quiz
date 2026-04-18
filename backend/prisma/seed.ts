import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset in reverse FK dependency order
  await prisma.answer.deleteMany();
  await prisma.playerResult.deleteMany();
  await prisma.gameRoom.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();

  // Create quiz with questions
  const quiz = await prisma.quiz.create({
    data: {
      title: 'English Essentials',
      questions: {
        create: [
          {
            content: 'What is the synonym of "Adept"?',
            options: ['Clumsy', 'Skilled', 'Ignorant', 'Lazy'],
            correctAnswer: 'Skilled',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'Select the correct meaning of "Ephemeral".',
            options: ['Permanent', 'Short-lived', 'Beautiful', 'Distant'],
            correctAnswer: 'Short-lived',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'What does "Mitigate" mean?',
            options: ['Increase', 'Worsen', 'Alleviate', 'Ignore'],
            correctAnswer: 'Alleviate',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'Choose the antonym of "Loquacious".',
            options: ['Talkative', 'Silent', 'Loud', 'Happy'],
            correctAnswer: 'Silent',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'What is the meaning of "Prudent"?',
            options: ['Reckless', 'Wise', 'Rash', 'Silly'],
            correctAnswer: 'Wise',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'What is the synonym of "Resilient"?',
            options: ['Fragile', 'Tough', 'Weak', 'Soft'],
            correctAnswer: 'Tough',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'Select the meaning of "Ubiquitous".',
            options: ['Rare', 'Omnipresent', 'Hidden', 'Large'],
            correctAnswer: 'Omnipresent',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'What does "Venerate" mean?',
            options: ['Despise', 'Respect', 'Hate', 'Ignore'],
            correctAnswer: 'Respect',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'Choose the correct meaning of "Zealous".',
            options: ['Enthusiastic', 'Apathetic', 'Lazy', 'Bored'],
            correctAnswer: 'Enthusiastic',
            points: 1000,
            timeLimitSeconds: 30,
          },
          {
            content: 'What is the synonym of "Abundant"?',
            options: ['Scarce', 'Plentiful', 'Empty', 'Small'],
            correctAnswer: 'Plentiful',
            points: 1000,
            timeLimitSeconds: 30,
          },
        ],
      },
    },
  });
  console.log(`Created quiz: ${quiz.title} with 10 questions`);

  // Sample completed GameRoom for dev testing
  const gameRoom = await prisma.gameRoom.create({
    data: {
      pin: '123456',
      quizId: quiz.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 10 * 60 * 1000),
      completedAt: new Date(),
    },
  });
  console.log(`Created sample game room with PIN: ${gameRoom.pin}`);

  // Sample PlayerResult rows
  await prisma.playerResult.createMany({
    data: [
      {
        gameRoomId: gameRoom.id,
        nickname: 'Alice',
        finalScore: 8500,
        rank: 1,
        completedAt: new Date(),
      },
      {
        gameRoomId: gameRoom.id,
        nickname: 'Bob',
        finalScore: 6200,
        rank: 2,
        completedAt: new Date(),
      },
    ],
  });
  console.log('Created 2 sample player results');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
