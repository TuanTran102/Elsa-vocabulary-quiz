# Task 11: Game Control Flow (Master-Driven)

## Context
The quiz must not start automatically. Only the master can trigger the start. Once started, the server drives the full question lifecycle: broadcasting each question, running a server-side countdown, revealing answers, advancing to the next question, and ending the game. This ensures all clients are perfectly in sync regardless of local clock drift.

## Objective
Build `GameFlowService` to orchestrate the complete server-side game loop: start, per-question timing, answer reveal, question transitions, and game completion with DB persistence.

## Acceptance Criteria

### GameFlowService Methods
- [ ] `startQuiz(pin: string): Promise<void>`
  - Validates: session exists, `status === 'waiting'`, at least 1 player in room
  - Updates Redis session status → `in_progress`
  - Updates DB `game_rooms.status = IN_PROGRESS`, `started_at = now()`
  - Broadcasts `quiz_started { total_questions }` to the entire room
  - Calls `startQuestion(pin, 0)` immediately

- [ ] `startQuestion(pin: string, index: number): Promise<void>`
  - Fetches question at `index` from Quiz questions (cached in session or queried from DB)
  - Sets `session.currentQuestionIndex = index` and `session.questionStartedAt = Date.now()` in Redis
  - Broadcasts `question_started { question_id, text, options, time_limit, question_number, total }` to room
  - Schedules `setTimeout(() => endQuestion(pin, index), time_limit * 1000)`

- [ ] `endQuestion(pin: string, index: number): Promise<void>`
  - Clears any pending timer for this question
  - Fetches answer distribution from Redis Hash `session:{pin}:q:{question_id}:dist`
  - Broadcasts `question_ended { correct_answer, answer_distribution }` to room
  - Waits 3 seconds (configurable) for players to see results
  - If `index + 1 < total_questions`: calls `startQuestion(pin, index + 1)`
  - Else: calls `endQuiz(pin)`

- [ ] `endQuiz(pin: string): Promise<void>`
  - Updates Redis session status → `completed`
  - Fetches final leaderboard from Redis ZSET (`ZREVRANGE session:{pin}:scores 0 -1 WITHSCORES`)
  - Updates DB: `game_rooms.status = COMPLETED`, `completed_at = now()`
  - Persists `PlayerResult` rows to DB for each player (nickname + final_score + rank)
  - Broadcasts `quiz_completed { final_leaderboard[] }` to room
  - Schedules Redis key cleanup after 10 minutes

### Answer Distribution Tracking
- [ ] When a player submits any answer (correct or incorrect), increment the counter in Redis:
  ```
  HINCRBY session:{pin}:q:{question_id}:dist "{answer_value}" 1
  ```
- [ ] This must be called from the answer submission handler (in `QuizGateway` or `QuizAnswerService`)

### Timer Management
- Store active timers in a `Map<string, NodeJS.Timeout>` keyed by `{pin}:{questionIndex}` inside `GameFlowService`
- Cancel the timer if `end_quiz` is requested early

### TDD Requirements
- Unit tests for each method using `jest.useFakeTimers()` for timer control
- Test edge cases: 0 players at start, unknown PIN, already completed session
- Test auto-advance after last question → calls `endQuiz`
- Test early end: timer is cleared when `endQuiz` is called manually

## Files to Create / Modify
- `src/modules/realtime/services/game-flow.service.ts` (new)
- `src/modules/realtime/gateways/quiz.gateway.ts` (integrate `GameFlowService`)
- `src/modules/quiz/services/quiz-answer.service.ts` (add distribution tracking call)
- `src/__tests__/modules/realtime/services/game-flow.service.test.ts` (new)

## Dependencies
- Task 09 (SessionService) ✅
- Task 10 (Role system — `start_quiz` event triggers this service) ✅
- Task 05 / 06 (Scoring & Leaderboard) ✅
- Task 15 (DB migration — `game_rooms`, `player_results` tables) ✅

## Estimated Effort: Large (5–6h)
