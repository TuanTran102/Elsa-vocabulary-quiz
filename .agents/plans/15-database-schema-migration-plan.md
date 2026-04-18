# Plan: Task 15 — Database Schema Migration

## Overview

This plan migrates the PostgreSQL schema from the old user-session model to the new Slido-like `GameRoom` / `PlayerResult` model. All steps follow TDD: tests are written (or updated) before the implementation is changed.

---

## Step 1: Update `prisma/schema.prisma`

### 1.1 Remove obsolete models and fields
- Delete the `User` model and the `users` table mapping.
- Delete the `QuizSession` model and the `quiz_sessions` table mapping.
- Delete the `QuizStatus` enum (`DRAFT`, `ACTIVE`, `FINISHED`).
- On the `Quiz` model, remove:
  - `status QuizStatus` field
  - `startedAt DateTime?` field
  - `sessions QuizSession[]` relation
- On the `Answer` model, remove:
  - `sessionId String` field
  - `session QuizSession` relation

### 1.2 Add new models and enum
- Add `GameRoomStatus` enum with values: `WAITING`, `IN_PROGRESS`, `COMPLETED`.
- Add `GameRoom` model (as specified in the task):
  - Fields: `id`, `pin` (unique), `quizId`, `status`, `startedAt?`, `completedAt?`, `createdAt`
  - Relations: `quiz Quiz`, `results PlayerResult[]`
  - Table map: `game_rooms`
- Add `PlayerResult` model (as specified in the task):
  - Fields: `id`, `gameRoomId`, `nickname`, `finalScore`, `rank`, `completedAt`
  - Relations: `gameRoom GameRoom`, `answers Answer[]`
  - Table map: `player_results`

### 1.3 Modify existing models
- On the `Quiz` model:
  - Remove `sessions QuizSession[]`
  - Add `gameRooms GameRoom[]`
- On the `Answer` model:
  - Remove `sessionId String` + `session QuizSession` relation
  - Add `playerResultId String @map("player_result_id")`
  - Add `playerResult PlayerResult` relation

---

## Step 2: Run the Prisma Migration

- Run: `npx prisma migrate dev --name slido_schema_redesign` (inside `backend/`)
- Inspect the generated SQL in `prisma/migrations/` to verify:
  - `users` and `quiz_sessions` tables are dropped.
  - `game_rooms` and `player_results` tables are created with correct columns and FK constraints.
  - `answers.session_id` is replaced by `answers.player_result_id`.
  - No data-loss concerns in development (use `prisma migrate reset` if needed).
- Run: `npx prisma generate` to regenerate the Prisma Client types.

---

## Step 3: Update `prisma/seed.ts`

### 3.1 Remove obsolete seed data
- Remove `prisma.answer.deleteMany()` (before `QuizSession` was removed; the order of deletes must now reflect new FKs).
- Remove `prisma.quizSession.deleteMany()`.
- Remove `prisma.user.deleteMany()`.
- Remove the `user` creation block.
- Remove the `QuizStatus` import and the `status: QuizStatus.ACTIVE` field from quiz creation.

### 3.2 Update cleanup block order
New cleanup order (reverse FK dependency):
1. `prisma.answer.deleteMany()`
2. `prisma.playerResult.deleteMany()`
3. `prisma.gameRoom.deleteMany()`
4. `prisma.question.deleteMany()`
5. `prisma.quiz.deleteMany()`

### 3.3 Add sample `GameRoom` and `PlayerResult` (optional but recommended for dev testing)
- After creating the quiz, create one `GameRoom` with `status: 'COMPLETED'`.
- Create two `PlayerResult` rows linked to that game room with sample nicknames and scores.
- Do NOT create `Answer` rows in seed (keep it minimal).

---

## Step 4: Update `QuizAnswerService`

**File:** `src/modules/quiz/services/quiz-answer.service.ts`

### 4.1 Change method signature
- Replace `userId: string` with `playerResultId: string` (the player's ID stored in the Redis session, representing a `PlayerResult` record).

### 4.2 Remove QuizSession lookup
- Remove the `prisma.quizSession.findUnique(...)` block entirely.
- The caller (Gateway) is responsible for resolving the `playerResultId` from the Redis player session before calling this service.

### 4.3 Update persistence logic
- In the `prisma.answer.create(...)` call:
  - Replace `sessionId: session.id` with `playerResultId`.
- Remove the `prisma.quizSession.update(...)` call (total score tracking moves to the end-of-game flow in Task 16/17, not per-answer).
- Keep the `leaderboardService.addPoints(pin, playerId, pointsAwarded)` call — but note the key changes to `pin` (room PIN) instead of `quizId`, and `playerId` instead of `userId` (align with what the Gateway passes).

### 4.4 Update constructor
- Remove `prisma: PrismaClient` parameter if it is no longer needed (only used for the removed session lookup and score update). Keep it if needed for `answer.create`.

---

## Step 5: Update `LeaderboardService`

**File:** `src/modules/quiz/services/leaderboard.service.ts`

### 5.1 Remove `prisma.user` lookup
- The `getLeaderboard` method currently fetches `username` from the `users` table. Since `User` is removed, nicknames must come from Redis session data instead.
- Change the method signature and logic: `getLeaderboard(pin: string, limit?: number)`.
- After fetching `topScores` from `redisRepo.getTopScores(pin, limit)`, the score entries already contain `playerId` keys.
- Retrieve player nicknames from the Redis session (`session:{pin}`), not from PostgreSQL.
- The return shape can change: `{ nickname: string; score: number }[]`.

### 5.2 Remove Prisma dependency
- If Prisma is no longer used in `LeaderboardService`, remove the constructor parameter.

### 5.3 Update `addPoints`
- Change signature: `addPoints(pin: string, playerId: string, points: number)` to use `pin` as the Redis namespace key consistently with the rest of the flow.

---

## Step 6: TDD — Write / Update Tests (Before Changing Service Code)

### 6.1 Update `quiz-answer.service.test.ts`
- Replace all references to `userId` with `playerResultId`.
- Remove assertions on `mockPrisma.quizSession.findUnique`.
- Remove assertions on `mockPrisma.quizSession.update`.
- Update `mockPrisma.answer.create` expectation: use `playerResultId` instead of `sessionId`.
- Keep the positive/negative/idempotency test cases — they remain logically the same.
- Add a test case: when `playerResultId` is provided, skip session lookup and go straight to persistence.

### 6.2 Update `leaderboard.service.test.ts`
- Remove all mocks and assertions for `prismaMock.user.findMany`.
- Add mock for a new Redis repo method that retrieves nickname by `playerId` (e.g., `redisRepo.getNickname(pin, playerId)` or by reading the `session:{pin}` JSON).
- Update result shape assertions: `{ nickname, score }` instead of `{ username, score }`.
- Test the "unknown player" fallback (e.g., if the Redis session has expired, use `'Unknown'`).

### 6.3 Add integration smoke test
**File:** `src/__tests__/integration/prisma-schema.integration.test.ts` (new file)

Test cases:
1. **Create a `GameRoom`**: Use the Prisma test client (or mock) to create a `GameRoom` linked to a seeded `Quiz` and assert fields are persisted.
2. **Create a `PlayerResult`**: Link it to the `GameRoom`, assert FK integrity.
3. **Create an `Answer`**: Link it to a `PlayerResult` and a `Question`, assert the `playerResultId` FK is saved correctly.
4. **Verify relational includes**: Fetch a `GameRoom` with `results.answers` nested and assert the shape.

> **Note:** Integration tests should use a test database or a mocked Prisma client (deep mock). Prefer mocked Prisma for unit-style integration tests to avoid requiring a live DB in CI.

---

## Step 7: Verify No Remaining References to Removed Models

Run a codebase-wide search for the following identifiers to ensure full cleanup:

| Identifier | Expected Outcome |
|---|---|
| `QuizSession` | No references remaining |
| `quizSession` (camelCase) | No remaining Prisma calls |
| `User` (Prisma model) | No remaining Prisma calls |
| `prisma.user` | No references |
| `QuizStatus` | No references |
| `sessionId` (as FK field) | No remaining Answer field usage |
| `quiz_sessions` | No remaining SQL strings |
| `users` table | No remaining SQL strings |

---

## Step 8: Verify All Existing Tests Pass

- Run `npm test` in `backend/`.
- All previously passing tests must continue to pass.
- The new integration smoke test must pass.
- Coverage should remain at or near 100% for modified service files.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Major rewrite |
| `prisma/seed.ts` | Update (remove User/Session, add GameRoom sample) |
| `prisma/migrations/` | Auto-generated by `prisma migrate dev` |
| `src/modules/quiz/services/quiz-answer.service.ts` | Refactor (remove session lookup, use playerResultId) |
| `src/modules/quiz/services/leaderboard.service.ts` | Refactor (remove Prisma user lookup, use Redis nicknames) |
| `src/__tests__/modules/quiz/services/quiz-answer.service.test.ts` | Update mocks and assertions |
| `src/__tests__/modules/quiz/services/leaderboard.service.test.ts` | Update mocks and assertions |
| `src/__tests__/integration/prisma-schema.integration.test.ts` | **New file** — smoke tests |

---

## Execution Order

```
Step 6 (write failing tests) → Step 1 (schema) → Step 2 (migrate) → Step 3 (seed)
→ Step 4 (QuizAnswerService) → Step 5 (LeaderboardService) → Step 7 (search & verify)
→ Step 8 (run all tests)
```

> Warning: Run `npx prisma migrate reset` (dev only) before applying the migration if the local database already has old table data.
