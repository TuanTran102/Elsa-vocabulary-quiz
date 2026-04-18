# Plan: Task 02 - Database Modeling & Seeding

This plan outlines the steps to establish the relational data structure using Prisma ORM and populate it with initial data.

## 1. Prerequisites
- PostgreSQL and Redis containers must be running (from Task 01).
- Backend environment is initialized with Node.js and TypeScript.

## 2. Implementation Steps

### Step 1: Prisma Initialization
- Navigate to the `backend` directory.
- Run `npx prisma init`.
- Update `.env` with `DATABASE_URL="postgresql://user:password@localhost:5432/quiz_db?schema=public"`.
- Verify connection by running `npx prisma migrate status`.

### Step 2: Define Prisma Schema
- Modify `backend/prisma/schema.prisma` to include models based on `db_design.md`:
  - **User**: `id`, `username`, `createdAt`, `updatedAt`, `sessions` (relation).
  - **Quiz**: `id`, `title`, `status` (Enum: DRAFT, ACTIVE, FINISHED), `startedAt`, `createdAt`, `updatedAt`, `questions` (relation), `sessions` (relation).
  - **Question**: `id`, `quizId`, `content`, `options` (JSONB), `correctAnswer`, `points`, `timeLimitSeconds`, `quiz` (relation), `answers` (relation).
  - **QuizSession**: `id`, `quizId`, `userId`, `totalScore`, `joinedAt`, `quiz` (relation), `user` (relation), `answers` (relation).
    - Add unique constraint on `[quizId, userId]`.
  - **Answer**: `id`, `sessionId`, `questionId`, `userAnswer`, `isCorrect`, `pointsAwarded`, `submittedAt`, `session` (relation), `question` (relation).
- Ensure UUIDs are used for primary keys where specified.

### Step 3: Database Migration
- Run `npx prisma migrate dev --name init_schema`.
- Verify the `migrations/` directory is created and the SQL file contains the correct table definitions.

### Step 4: Database Seeding
- Create `backend/prisma/seed.ts`.
- Implementation:
  - Clear existing data (optional but recommended for clean seeds).
  - Create 1 User (e.g., `testuser`).
  - Create 1 Quiz "English Essentials" with status `ACTIVE`.
  - Create 10 Questions for the quiz, each with:
    - `content`: A vocabulary question.
    - `options`: A JSON array of 4 strings.
    - `correctAnswer`: One of the options.
    - `points`: 1000.
    - `timeLimitSeconds`: 30.
- Update `package.json` with prisma seed configuration:
  ```json
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
  ```
- Run `npx prisma db seed`.

### Step 5: Verification (TDD Perspective)
- Since we are using TDD, we should verify the schema via integration tests.
- Create `backend/src/__tests__/config/db.test.ts` (as per `detail_design.md` suggestion).
- Test cases:
  - Should be able to connect to the database.
  - Should confirm that the `User` model exists and can be queried.
  - Should confirm that the `Quiz` model exists and has 1 record from seeding.
  - Should confirm that the `Question` model exists and has 10 records linked to the quiz.

## 3. Final Verification
- **Schema Alignment**: Verified against `db_design.md`. All fields, types (UUID, JSONB), and constraints are accounted for.
- **Prisma Relations**: 1:N and M:N (via QuizSession) relationships are confirmed to be standard Prisma patterns.
- **Seeding logic**: Data structure for vocabulary questions (4 options, 1 correct string) is clear.

Plan is finalized and ready for implementation.
