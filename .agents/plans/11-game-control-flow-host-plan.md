# Task 11: Game Control Flow (Master-Driven) Implementation Plan

## Overview
This task implements a server-driven game loop where the Master (Host) triggers the start, and the server orchestrates the entire session: broadcasting questions, managing countdowns, revealing answers, and finalizing the game. This ensures synchronization across all clients.

## Proposed Changes

### 1. Model & Type Updates
- Add `currentQuestionIndex`, `totalQuestions`, and `questionStartedAt` to `GameSession` type in `backend/src/modules/session/session.types.ts`.
- Ensure `SessionStatus` includes `IN_PROGRESS` and `COMPLETED`.

### 2. GameFlowService (`backend/src/modules/realtime/services/game-flow.service.ts`)
A new service to manage the automated game loop.

#### Logic:
- **`startQuiz(pin: string)`**:
    - Validate session exists and status is `WAITING`.
    - Check if at least 1 player is in the room.
    - Update status to `IN_PROGRESS` in Redis and DB (`startedAt = now()`).
    - Fetch total questions count.
    - Broadcast `quiz_started { total_questions }`.
    - Call `startQuestion(pin, 0)`.
- **`startQuestion(pin: string, index: number)`**:
    - Fetch question data for the given index.
    - Update `currentQuestionIndex` and `questionStartedAt` in Redis session.
    - Broadcast `question_started { question_id, text, options, time_limit, question_number, total }`.
    - Schedule `endQuestion(pin, index)` using `setTimeout` based on `time_limit`.
    - Track the timer in a class-level `Map` to allow cancellation.
- **`endQuestion(pin: string, index: number)`**:
    - Clear the active timer for the session.
    - Fetch answer distribution from Redis Hash `session:{pin}:q:{question_id}:dist`.
    - Broadcast `question_ended { correct_answer, answer_distribution }`.
    - Wait 3 seconds (cooldown) then:
        - If more questions: call `startQuestion(pin, index + 1)`.
        - Else: call `endQuiz(pin)`.
- **`endQuiz(pin: string)`**:
    - Update status to `COMPLETED` in Redis and DB (`completedAt = now()`).
    - Fetch final leaderboard from Redis ZSET.
    - Persist final results to PostgreSQL `PlayerResult` table.
    - Broadcast `quiz_completed { final_leaderboard }`.
    - Schedule Redis session cleanup after 10 minutes.

### 3. QuizAnswerService Tracking
- Modify `submitAnswer` to increment answer distribution in Redis:
  `HINCRBY session:{pin}:q:{question_id}:dist "{answer_value}" 1`

### 4. Integration in QuizGateway
- Inject `GameFlowService` into `QuizGateway`.
- Update `start_quiz` event handler to call `gameFlowService.startQuiz(pin)`.
- Remove manual status updates from the gateway as they move to the service.

## TDD Plan

### Unit Tests (`backend/src/__tests__/modules/realtime/services/game-flow.service.test.ts`)
- **Setup**: Use `jest.useFakeTimers()` to control time-based events. Mock `Redis`, `PrismaClient`, and `Server` (io).
- **Test cases**:
    - `startQuiz` fails if room is empty or session not found.
    - `startQuiz` succeeds: updates status, broadcasts, and kicks off first question.
    - `startQuestion` broadcasts correct payload and sets timer.
    - `endQuestion` broadcasts distribution and schedules next question after cooldown.
    - `endQuiz` persists data and cleans up Redis.
    - Auto-advance: Verify the chain `start -> end -> start` works correctly using `jest.advanceTimersByTime()`.
    - Early termination: Verify timers are cleared if `endQuiz` is called manually.

### Integration Testing
- Verify the end-to-end flow from `start_quiz` socket event to `quiz_completed` event using a real Redis instance in the integration test suite.

## Requirements Confirmation
- **Answer Distribution**: Includes statistics only for the **current question**.
- **Cooldown Period**: Fixed at **3 seconds** between questions.
- **Early Termination**: `endQuiz` logic is triggered even if the Master ends the game early, ensuring leaderboard persistence for completed questions.

## Verification Plan
1. Run `npm run test` to verify all unit tests pass.
2. Run `npm run test:integration` to verify WebSocket flow.
3. Manually test using the "Master" UI (to be built in next tasks) or using a socket client script.
