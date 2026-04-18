/*
  Warnings:

  - You are about to drop the column `session_id` on the `answers` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the `quiz_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `player_result_id` to the `answers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameRoomStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_session_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_sessions" DROP CONSTRAINT "quiz_sessions_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_sessions" DROP CONSTRAINT "quiz_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "answers" DROP COLUMN "session_id",
ADD COLUMN     "player_result_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "started_at",
DROP COLUMN "status";

-- DropTable
DROP TABLE "quiz_sessions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "QuizStatus";

-- CreateTable
CREATE TABLE "game_rooms" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "status" "GameRoomStatus" NOT NULL DEFAULT 'WAITING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_results" (
    "id" TEXT NOT NULL,
    "game_room_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "final_score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "completed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_rooms_pin_key" ON "game_rooms"("pin");

-- AddForeignKey
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_results" ADD CONSTRAINT "player_results_game_room_id_fkey" FOREIGN KEY ("game_room_id") REFERENCES "game_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_player_result_id_fkey" FOREIGN KEY ("player_result_id") REFERENCES "player_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
