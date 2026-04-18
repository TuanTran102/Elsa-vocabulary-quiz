# Plan 05: Scoring Engine & Answer Validation

This plan implements the answer submission, validation, and scoring logic for the real-time vocabulary quiz.

## 1. Objective
Implement the "brain" of the quiz:
- Listen for `submit_answer` WebSocket events.
- Ensure only one submission per user per question (Idempotency via Redis).
- Validate the answer correctness.
- Calculate scores based on speed and base points.
- Persist results to PostgreSQL.

## 2. Technical Details

### 2.1 Scoring Algorithm
- **Formula**: `Points = Base Points * (Time Remaining / Total Time Allowed)`
- **Speed Bonus**: Implicitly included in the time-based calculation.
- **Constraints**: 
  - Minimum 0 points.
  - Maximum equals `Base Points` (if answered instantly).
  - Time constants (Total Time) will be retrieved from the `Question` model.

### 2.2 Redis State keys
- **Idempotency**: `quiz:{quiz_id}:answered:{question_id}:{user_id}` (Value: 1, TTL: 1 hour)
- **Question Start Time**: `quiz:{quiz_id}:question:{question_id}:start_time` (Unix timestamp)

### 2.3 Database Interaction
- Create or Update `Answer` record.
- Atomically increment `QuizSession.totalScore`.

## 3. Implementation Steps

### Phase 1: Infrastructure & Utils
1. **Redis Repository/Helper**:
   - Implement `lockAnswerSubmission(quizId, questionId, userId)` using `SETNX`.
   - Implement `getQuestionStartTime(quizId, questionId)` to retrieve the start timestamp.

### Phase 2: Scoring Engine (TDD)
1. **ScoringService**:
   - `calculateScore(params: { basePoints, startTime, submissionTime, limitSeconds })`: Returns calculated score.
   - Unit tests covering:
     - Instant response (Max points).
     - Response at exactly 50% time (50% points).
     - Response after time limit (0 points).
     - Margin cases (0.1s left, etc.).

### Phase 3: Quiz Answer Service
1. **QuizAnswerService**:
   - `submitAnswer(userId, quizId, questionId, answer)`:
     - Call Redis lock. If exists -> throw `DuplicateSubmissionError`.
     - Fetch `Question` (cached or via DB).
     - Get `startTime` from Redis.
     - Calculate `isCorrect`.
     - Calculate `score` using `ScoringService`.
     - Find `QuizSession` for the user.
     - Persistence:
       - Save `Answer` to PostgreSQL.
       - Increment `totalScore` in `QuizSession`.
   - Unit tests with mocked Prisma and Redis.

### Phase 4: Integration with Realtime Gateway
1. **QuizGateway**:
   - Add `submit_answer` event listener.
   - Extract `user_id` from socket context.
   - Call `QuizAnswerService.submitAnswer`.
   - Emit `answer_status` to user (success/failure, points earned).
   - Integration tests:
     - Connect socket, join quiz, emit `submit_answer`.
     - Verify DB state.
     - Verify secondary submission rejection.

## 4. Acceptance Criteria
- [x] Correct formula implementation in `ScoringService`.
- [x] `SETNX` prevents multiple answers for the same question.
- [x] Answers are saved to the `Answer` table.
- [x] QuizSession `totalScore` reflects the sum of all points awarded.
- [x] 100% test coverage for `ScoringService` and `QuizAnswerService`.

## 5. Files to Create/Modify
- `backend/src/modules/quiz/services/scoring.service.ts`
- `backend/src/modules/quiz/services/quiz-answer.service.ts`
- `backend/src/modules/quiz/repositories/answer.repository.ts` (if needed)
- `backend/src/modules/realtime/quiz.gateway.ts` (modify)
- Tests in `backend/src/__tests__/modules/quiz/services/...`
