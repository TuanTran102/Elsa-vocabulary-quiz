# Plan 06: Leaderboard Logic (Redis ZSET)

This plan implements the high-performance ranking engine and real-time leaderboard broadcasting.

## 1. Objective
Enable real-time competition by:
- Maintaining a sorted leaderboard for each quiz session using Redis Sorted Sets.
- Resolving User IDs to Usernames for display.
- Periodically broadcasting the top standings to all participants in a room, with throttling to ensure stability.

## 2. Technical Details

### 2.1 Redis Schema
- **Leaderboard Key**: `quiz:{quiz_id}:leaderboard` (Type: ZSET)
- **Score Storage**: User IDs as members, cumulative points as scores.
- **Commands**:
  - `ZINCRBY`: Atomically increment a user's score.
  - `ZREVRANGE leaderboard 0 9 WITHSCORES`: Fetch the top 10 players.

### 2.2 Enrichment Strategy
The Redis ZSET only stores `userId`. To show "John: 500pts" instead of "123: 500pts":
1. Fetch top scores from Redis.
2. Resolve `userIds` to labels.
   - *Option A*: Query PostgreSQL (Prisma) each time.
   - *Option B*: Store `user:{userId}:name` in Redis for faster lookup.
   - *Decision*: Start with Prisma (Task 6), add Redis caching if overhead is high.

### 2.3 Throttling Logic
To avoid sending 100 WebSocket messages per second in a busy quiz:
- Implement a `throttle` bucket per `quizId`.
- Max broadcast frequency: **1 second**.
- If multiple players answer correctly within 1s, only one `leaderboard_update` event is emitted at the end of the window.

## 3. Implementation Steps

### Phase 1: Repository Layer (TDD)
1. **Modify `QuizRedisRepository`**:
   - Add `incrementScore(quizId, userId, score)`: Wraps `ZINCRBY`.
   - Add `getTopScores(quizId, limit)`: Wraps `ZREVRANGE ... WITHSCORES`.
2. **Tests**:
   - Verify score increments are cumulative.
   - Verify rankings are correct (highest score at index 0).

### Phase 2: Leaderboard Service (TDD)
1. **Create `LeaderboardService`**:
   - `addPoints(quizId, userId, points)`: Updates Redis.
   - `getLeaderboard(quizId)`: Fetches top 10, queries usernames from `User` table, returns array of objects `{ username, score }`.
2. **Tests**:
   - Mock Prisma and Redis.
   - Verify enrichment logic handles missing users gracefully.

### Phase 3: Integration with Scoring Flow
1. **Modify `QuizAnswerService`**:
   - In `submitAnswer`, after saving a correct answer and calculating points:
   - Call `leaderboardService.addPoints(quizId, userId, calculatedScore)`.
   - Trigger the gateway to broadcast update.

### Phase 4: Gateway Broadcasting & Throttling
1. **Modify `QuizGateway`**:
   - Add `requestLeaderboardUpdate(quizId)`:
     - Check if a throttle timer is active for this `quizId`.
     - If yes, do nothing (a broadcast is already scheduled or just happened).
     - If no, schedule a broadcast after `1000ms`.
   - Implement `emitLeaderboard(quizId)`:
     - Fetch enriched data from `LeaderboardService`.
     - `io.to(quizId).emit('leaderboard_update', data)`.

### Phase 5: Integration Testing
1. **WebSocket Test**:
   - Multiple clients join a room.
   - Two clients submit correct answers.
   - Verify `leaderboard_update` is received by both.
   - Verify the ranking order is correct.

## 4. Acceptance Criteria
- [ ] Redis correctly sorts users by score in descending order.
- [ ] Usernames are correctly resolved and included in the update event.
- [ ] Leaderboard updates are throttled to once per second per quiz.
- [ ] 100% test coverage for Leaderboard logic.

## 5. Files to Create/Modify
- `backend/src/modules/quiz/repositories/quiz-redis.repository.ts` (Modify)
- `backend/src/modules/quiz/services/leaderboard.service.ts` (New)
- `backend/src/modules/quiz/services/quiz-answer.service.ts` (Modify)
- `backend/src/modules/realtime/quiz.gateway.ts` (Modify)
- `backend/src/__tests__/modules/quiz/services/leaderboard.service.test.ts` (New)
- `backend/src/__tests__/modules/realtime/leaderboard.integration.test.ts` (New)
