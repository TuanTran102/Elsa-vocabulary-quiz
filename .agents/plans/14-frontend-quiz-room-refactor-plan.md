# Implementation Plan - Task 14: Frontend Quiz Room Refactor (Player Experience)

Refactor the quiz player experience from a client-driven model to a fully server-driven, socket-controlled model. Replacing `QuizRoom.vue` with `PlayPage.vue` and adding `ResultsPage.vue`.

## User Review Required (Resolved)

> [!NOTE]
> - **Confetti**: Using `canvas-confetti` (standard lightweight library).
> - **Toasts**: Using standard **PrimeVue Toast Service** (library already present in project).
> - **Re-joining**: Full support for joining midway. `PlayPage` will fetch session state on mount and sync the current active question if the game is `IN_PROGRESS`.

## Proposed Implementation

### 1. Router & Store Refinement
- **Router Configuration**: 
    - Update `src/router/index.ts` to add `/play/:pin` and `/results/:pin`.
    - Remove the legacy `/quiz/:id` route.
    - Implement a navigation guard for these routes that redirects to `/join` if `userStore.pin` or `userStore.nickname` is not set.
- **Store Cleanup**:
    - `src/store/quiz.ts`: Remove `autoStart` logic and direct `fetchQuizzes` usage for the room.
    - `src/store/user.ts`: Ensure `score` and `rank` properties are available for real-time updates.

### 2. PlayPage.vue Development (TDD)
Replace `QuizRoom.vue` with a lean, reactive component.

#### Tests (`src/__tests__/views/PlayPage.spec.ts`)
- **Socket Initialization**: Verify it listens to `question_started`, `question_ended`, `answer_result`, `leaderboard_update`, `quiz_completed`, and `host_disconnected`.
- **State Transitions**:
    - **New Question**: Verify buttons are enabled, selected state is null, and countdown starts.
    - **Answer Submission**: Verify clicking an option emits `submit_answer` and disables all options.
    - **Results phase**: Verify correct answer is highlighted and distribution percentages are calculated correctly from the event payload.
- **Midway Re-join**:
    - Mock `GET /api/v1/sessions/:pin` to return an active question.
    - Verify `PlayPage` correctly sets the current question, starts the visual timer from remaining time, and checks if the user has already answered.
- **Navigation**: Verify it pushes to `/results/:pin` when `quiz_completed` is received.

#### UI Implementation
- **Layout**: Center questions/options, right-side mini-leaderboard (collapsible on mobile).
- **Toast**: Trigger `toast.add()` from PrimeVue on `answer_result`.
- **Question View**:
    - Text and multiple-choice buttons.
    - Visual timer bar (matches color scheme, smooth transition).
- **Transition Phase**:
    - After `question_ended`, overlay distribution bars (progress bars) inside the buttons.
    - Highlight correct/wrong choices with distinct green/red borders or fills.
- **Leaderboard**: Use Vue's `<TransitionGroup>` for the "shuffling" animation effect when ranks change.

### 3. ResultsPage.vue Development (TDD)
Display the final results in a celebratory way.

#### Tests (`src/__tests__/views/ResultsPage.spec.ts`)
- **Leaderboard Rendering**: Verify the full list is rendered.
- **Podium Logic**: Verify the first 3 players have unique CSS classes (gold, silver, bronze).
- **User Context**: Verify the current user's entry is visually distinct.

#### UI Implementation
- **Hero Section**: Prominent "Your Rank: #12" and "Final Score: 4500".
- **Leaderboard**: Scrollable list of all participants.
- **Confetti**: Use `canvas-confetti` on mount.
- **Navigation**: "Play Again" button returning the user to `/join`.

### 4. Edge Case Handling
- **Host Disconnect**: Full-screen modal display with an "Exit" button.
- **Late Join/Refresh**: Logic to sync state with the server if the session is `in_progress`.

## Verification Plan

### Automated Tests
- Run `npm run test` for all frontend specs.
- Ensure 100% coverage for the new `PlayPage` and `ResultsPage` logic.

### Manual Verification
1. Open Host Dashboard in one browser tab and Join as a Player in another.
2. Verify player only sees what the host starts.
3. Verify answer distribution appears on the player's screen after the time limit.
4. Verify points toast appears instantly on the player's screen.
5. Verify smooth navigation to the results page when the host finishes the quiz.
6. Refresh the player page during a question and verify it stays in sync.
