# Task 15: Database Schema Migration

## Context
The new Slido-like flow requires significant changes to the PostgreSQL schema:
- The old `quiz_sessions` table conflated two concepts (game room metadata + player participation record) and assumed a persistent `User` entity.
- Players are now anonymous guests with nicknames — no user account is needed.
- A `GameRoom` model tracks live session metadata (PIN, status, timing).
- A `PlayerResult` model records each player's final score after game completion.
- The `Answer` table must be re-linked from `quiz_sessions` → `player_results`.

This task implements and validates all required schema changes while ensuring backward compatibility via a clean migration.

## Objective
Update the Prisma schema, generate and apply the migration, update the seed file, and ensure all existing services that reference removed models are updated.

## Acceptance Criteria

### Prisma Schema Changes

**Remove:**
- [ ] `User` model (and `users` table)
- [ ] `QuizSession` model (and `quiz_sessions` table)
- [ ] `Quiz.status` field (QuizStatus enum)
- [ ] `Quiz.startedAt` field
- [ ] `Quiz.sessions` relation

**Add — `GameRoom` model:**
```prisma
model GameRoom {
  id          String         @id @default(uuid())
  pin         String         @unique
  quizId      String         @map("quiz_id")
  status      GameRoomStatus @default(WAITING)
  startedAt   DateTime?      @map("started_at")
  completedAt DateTime?      @map("completed_at")
  createdAt   DateTime       @default(now()) @map("created_at")
  quiz        Quiz           @relation(fields: [quizId], references: [id])
  results     PlayerResult[]

  @@map("game_rooms")
}

enum GameRoomStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
}
```

**Add — `PlayerResult` model:**
```prisma
model PlayerResult {
  id          String    @id @default(uuid())
  gameRoomId  String    @map("game_room_id")
  nickname    String
  finalScore  Int       @default(0) @map("final_score")
  rank        Int       @default(0)
  completedAt DateTime  @default(now()) @map("completed_at")
  gameRoom    GameRoom  @relation(fields: [gameRoomId], references: [id])
  answers     Answer[]

  @@map("player_results")
}
```

**Modify — `Answer` model:**
- [ ] Remove `sessionId` field + `QuizSession` relation
- [ ] Add `playerResultId String @map("player_result_id")` (FK → `player_results.id`)
- [ ] Update Prisma relation accordingly

**Modify — `Quiz` model:**
- [ ] Remove `sessions QuizSession[]` relation
- [ ] Add `gameRooms GameRoom[]` relation
- [ ] Remove `status` and `startedAt` fields

### Prisma Migration
- [ ] Run `npx prisma migrate dev --name slido_schema_redesign`
- [ ] Verify migration SQL is correct (DOWN migration should be a no-op for fresh installs)
- [ ] Run `npx prisma generate` to update the Prisma Client

### Seed File Update (`prisma/seed.ts`)
- [ ] Remove any seed data for `users` and `quiz_sessions`
- [ ] Keep quiz + question seed data (these are unchanged)
- [ ] Optionally add a sample `GameRoom` in `COMPLETED` status with `PlayerResult` rows for testing

### Service Updates
Update all backend services that reference removed models:
- [ ] `QuizAnswerService` — remove `userId` / `QuizSession` references; use `playerResultId` instead
- [ ] `LeaderboardService` — remove username lookup from `users` table; nicknames now come from Redis session
- [ ] `ScoringService` — verify no direct dependency on `User` or `QuizSession`
- [ ] Any REST controller that returns `user_id` in responses — replace with `nickname`

### TDD Requirements
- Update existing unit tests that mock `prisma.quizSession` → mock `prisma.gameRoom` / `prisma.playerResult`
- Update existing unit tests that mock `prisma.user` → remove or mock with nickname-based data
- Add integration smoke test: create a `GameRoom` row via Prisma, create a `PlayerResult`, verify relations

## Files to Create / Modify
- `prisma/schema.prisma` (major update)
- `prisma/seed.ts` (update)
- `prisma/migrations/` (auto-generated migration)
- `src/modules/quiz/services/quiz-answer.service.ts` (update references)
- `src/modules/leaderboard/services/leaderboard.service.ts` (update username lookup)
- `src/__tests__/` (update all affected test mocks)

## Migration Safety Notes
> ⚠️ This is a **breaking schema change**. If running against an existing database with data:
> - Drop and recreate the database in development (`npx prisma migrate reset`)
> - For production: coordinate with data team for a proper migration window

## Dependencies
- Task 02 (original DB setup) ✅ — this task supersedes parts of it
- Must be completed **before** Tasks 09, 10, 11 (all backend tasks depend on new schema)

## Estimated Effort: Medium (3–4h)
