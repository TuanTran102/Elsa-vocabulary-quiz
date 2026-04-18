# Task 14: Frontend — PlayPage Refactor (Player Experience)

## Context
`QuizRoom.vue` currently fetches quiz data directly and auto-starts the timer on mount. This must be completely overhauled: the play experience is now **entirely server-driven** via socket events. The component must never self-advance — it only reacts to `question_started`, `question_ended`, and `quiz_completed` events from the server.

## Objective
Refactor `QuizRoom.vue` into `PlayPage.vue` — a fully socket-driven question screen — and create a `ResultsPage.vue` for the final leaderboard.

## Acceptance Criteria

### PlayPage (`/play/:pin`)

**Question Display** (on `question_started` event):
- [ ] Render question text and answer option buttons
- [ ] Start a client-side countdown from `time_limit` seconds (display only — server controls actual cutoff)
- [ ] Show question number indicator: "Question 2 / 5"
- [ ] Reset selected state and re-enable buttons for each new question

**Answer Submission**:
- [ ] On option click: disable all buttons immediately (one answer only)
- [ ] Emit `submit_answer { pin, question_id, answer }` via socket
- [ ] On `answer_result { is_correct, points_awarded }`:
  - If correct: show animated green toast "+850 pts!" and update `userStore` score
  - If incorrect: show red toast "Wrong!" — no score change
  - If timed out: show toast "Time's up!"

**Question End** (on `question_ended { correct_answer, answer_distribution }` event):
- [ ] Stop the client-side countdown
- [ ] Highlight the correct answer option in green
- [ ] If the player's selected answer was wrong, highlight it in red
- [ ] Show the answer distribution as a progress bar on each option button (e.g., "8 players — 53%")
- [ ] Display a brief "+0" or "+X pts" overlay, then wait for the next `question_started` event

**Leaderboard** (on `leaderboard_update`):
- [ ] Update right-side leaderboard with animated re-sorting (`TransitionGroup`)
- [ ] Highlight the current player's own row

**Game End** (on `quiz_completed { final_leaderboard }`):
- [ ] Navigate to `/results/:pin`

**Edge Cases**:
- [ ] On `host_disconnected`: show full-screen modal "The host has disconnected. The quiz has ended."
- [ ] On page refresh / late join while `in_progress`: call `GET /api/v1/sessions/:pin` to restore state, emit `rejoin_quiz { pin, playerId }` if session is still live

### ResultsPage (`/results/:pin`)
- [ ] Full final leaderboard (all players)
- [ ] Top 3 highlighted with gold/silver/bronze styling and animations
- [ ] Current player's row highlighted in a distinct accent color
- [ ] Current player's rank and total score displayed prominently
- [ ] "Play Again" button → navigates to `/join`
- [ ] Confetti animation on load (CSS or lightweight library)

### Store Cleanup
- [ ] Remove auto-start logic from `quiz.ts`
- [ ] Remove `fetchQuizzes` usage in `QuizRoom` context
- [ ] `userStore.score` updated on each `answer_result` event
- [ ] `sessionStore.status` updated on `quiz_completed`

### Router Updates
- [ ] Add routes `/play/:pin` (replacing `/quiz/:id`) and `/results/:pin`
- [ ] Navigation guard: redirect to `/join` if `userStore.pin` is null

### TDD Requirements
- Unit tests for all socket event handlers in `PlayPage`
- Test correct/incorrect answer highlight logic
- Test answer distribution display calculation
- Test navigation to `/results/:pin` on `quiz_completed`
- Component tests for `ResultsPage`: leaderboard rendering, own-player highlight

## Files to Create / Modify
- `src/views/PlayPage.vue` (new — replaces `QuizRoom.vue`)
- `src/views/ResultsPage.vue` (new)
- `src/store/quiz.ts` (remove auto-start, keep question/timer state)
- `src/router/index.ts` (update routes)
- `src/__tests__/views/PlayPage.spec.ts` (new)
- `src/__tests__/views/ResultsPage.spec.ts` (new)

## Dependencies
- Task 11 (Server emits `question_started`, `question_ended`, `quiz_completed`) ✅
- Task 12 (`userStore`, `sessionStore`, socket handlers) ✅

## Estimated Effort: Medium (4–5h)
