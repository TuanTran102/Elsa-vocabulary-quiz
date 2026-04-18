/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `speedBonus` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - Added the required column `isCorrect` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pointsAwarded` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAnswer` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FINISHED');

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_userId_fkey";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "createdAt",
DROP COLUMN "points",
DROP COLUMN "speedBonus",
DROP COLUMN "userId",
ADD COLUMN     "isCorrect" BOOLEAN NOT NULL,
ADD COLUMN     "pointsAwarded" INTEGER NOT NULL,
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAnswer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "text",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "timeLimitSeconds" INTEGER NOT NULL DEFAULT 30,
ALTER COLUMN "correctAnswer" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "description",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "QuizSession" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizSession_quizId_userId_key" ON "QuizSession"("quizId", "userId");

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
