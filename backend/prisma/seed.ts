import { PrismaClient, QuizStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset database (optional but recommended for clean seeds)
  // Delete in reverse order of dependencies
  await prisma.answer.deleteMany();
  await prisma.quizSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
    },
  });
  console.log(`Created user: ${user.username}`);

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'English Essentials',
      status: QuizStatus.ACTIVE,
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
