# Task 13: Frontend — Host Dashboard (Master View)

## Context
The master needs a dedicated experience: select a quiz to play, receive a PIN, monitor players joining in real-time, and control the quiz lifecycle from a single host dashboard.

## Objective
Build `CreatePage` and `HostDashboard` — the complete master experience from session creation through post-game results.

## Acceptance Criteria

### CreatePage (`/create`)
- [ ] Fetches and displays a list of available quiz templates from `GET /api/v1/quizzes`
- [ ] Each quiz card shows title and question count
- [ ] On quiz selection: call `POST /api/v1/sessions { quiz_id }` (or emit `create_quiz_session` via socket)
- [ ] On success: store PIN + `game_room_id` in `sessionStore`, navigate to `/host/:pin`
- [ ] Show loading state and error handling

### HostDashboard (`/host/:pin`)

**Phase 1 — Waiting Room** (`session.status === 'waiting'`):
- [ ] Display the PIN in large, easy-to-read format with a "Copy PIN" button
- [ ] Optional: display a QR code linking to `/join` with PIN pre-filled
- [ ] Live player list — updates on `player_joined` / `player_left` events
- [ ] Player count badge
- [ ] **"Start Quiz"** button:
  - Disabled with tooltip "Waiting for players…" when `players.length === 0`
  - Enabled when at least 1 player has joined
  - On click: emit `start_quiz { pin }` → transitions to Phase 2

**Phase 2 — In-Game Controls** (`session.status === 'in_progress'`):
- [ ] Display current question text and number (e.g., "Question 2 / 5")
- [ ] Countdown timer (synced from `question_started` event's `time_limit`)
- [ ] Live answer distribution — a bar chart updated on each `leaderboard_update` event showing how many players chose each option
- [ ] Mini leaderboard (top 5 with nicknames and scores)
- [ ] **"End Quiz"** button — emits `end_quiz { pin }` after confirmation dialog

**Phase 3 — Post-Game** (`session.status === 'completed'`):
- [ ] Full final leaderboard (all players ranked)
- [ ] Highlight top 3 with medal icons
- [ ] **"Host Another Quiz"** button → navigates back to `/create`
- [ ] **"Export Results"** button → downloads a CSV of the leaderboard

### Master Reconnect
- [ ] After `session_created`, store `masterToken` (received from server) in `localStorage`
- [ ] On `/host/:pin` load, if `masterToken` exists in storage → emit `reclaim_host { pin, masterToken }` to re-establish master socket
- [ ] If reclaim fails (expired token) → redirect to `/create`

### Socket Events Handled
- [ ] `player_joined` → update `sessionStore.players`
- [ ] `player_left` → update `sessionStore.players`
- [ ] `question_started` → update current question display + timer
- [ ] `question_ended` → show correct answer highlight on distribution chart
- [ ] `leaderboard_update` → update mini leaderboard
- [ ] `quiz_completed` → transition to Phase 3

### sessionStore Updates (from Task 12)
- [ ] Add `masterToken: string | null` to state
- [ ] Add action `setMasterToken(token)`

### TDD Requirements
- Unit tests for `sessionStore` master-specific actions
- Component tests for `CreatePage`: quiz list rendering, session creation flow
- Component tests for `HostDashboard`:
  - Start button enabled/disabled based on player count
  - Phase transition: waiting → in_progress → completed
  - Player list updates on socket events

## Files to Create / Modify
- `src/views/CreatePage.vue` (new)
- `src/views/HostDashboard.vue` (new)
- `src/store/session.ts` (extend with master-specific state/actions)
- `src/router/index.ts` (add `/create`, `/host/:pin` routes)
- `src/__tests__/views/CreatePage.spec.ts` (new)
- `src/__tests__/views/HostDashboard.spec.ts` (new)

## Dependencies
- Task 09 (Session REST API) ✅
- Task 10 (Master socket events: `create_quiz_session`, `start_quiz`, `end_quiz`) ✅
- Task 11 (Game flow events: `question_started`, `question_ended`, `quiz_completed`) ✅
- Task 12 (`sessionStore`, `userStore`) ✅

## Estimated Effort: Large (6–8h)
