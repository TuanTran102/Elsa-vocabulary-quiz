# Plan 07 - Frontend Foundation & State

This plan outlines the initialization of the frontend state management, real-time connectivity layer, and the lobby view for the vocabulary quiz application.

## 1. Setup & Infrastructure
- **Vue Router Initialization**: Since the project has `vue-router` in `package.json` but it's not yet configured, we will set up the basic routing structure.
- **Test Environment Check**: Ensure `vitest` is correctly configured to handle `.vue` files and PrimeVue components.

## 2. State Management (Pinia) - TDD
- **Goal**: Create a central store for quiz data.
- **Tests**:
    - `src/__tests__/store/quiz.test.ts`:
        - Verify initial state (currentQuiz=null, questions=[], participantsCount=0, etc.).
        - Verify actions for updating state (e.g., `setQuizzes`, `setCurrentQuiz`, `updateLeaderboard`).
- **Implementation**:
    - `src/store/quiz.ts`:
        - State: `currentQuiz`, `questions`, `participantsCount`, `leaderboard`, `userScore`, `availableQuizzes`.
        - Actions: `fetchQuizzes` (API call), `updateStateFromSocket`.

## 3. Socket Composable - TDD
- **Goal**: Provide a reactive interface for Socket.io events.
- **Tests**:
    - `src/__tests__/composables/useSocket.test.ts`:
        - Mock `socket.io-client`.
        - Verify `connect` is called.
        - Verify event listeners trigger callbacks or store updates.
        - Verify `emit` sends correct data.
- **Implementation**:
    - `src/composables/useSocket.ts`:
        - Initialize `io(VITE_API_URL)` using env variables.
        - Provide `connect`, `disconnect`, `on`, and `emit` wrappers.
        - Integrate with `useQuizStore` for global events (e.g., `leaderboard_update`).

## 4. Lobby View - TDD
- **Goal**: Display available quizzes and allow users to join.
- **Tests**:
    - `src/__tests__/views/Lobby.test.ts`:
        - Mock `QuizService` or store to return seeded quizzes.
        - Verify list of quizzes is rendered.
        - Verify "Join" button click redirects to the quiz room (mock router).
- **Implementation**:
    - `src/views/Lobby.vue`:
        - Fetch quizzes on mount.
        - Use PrimeVue `Card` and `Button` for the UI.
        - Add a basic "Username" input if not already handled (required for joining as per earlier backend tasks).

## 5. Integration
- Update `src/main.ts` to include the router.
- Define `src/router/index.ts` with routes for `/` (Lobby) and `/quiz/:id` (Quiz Room placeholder).
- Update `src/App.vue` to include `<RouterView />`.

## Acceptance Criteria
- [ ] Pinia store updates correctly when fetching quiz data.
- [ ] Socket connection is established when the app loads.
- [ ] Lobby view displays the seeded quizzes correctly.
- [ ] 100% Unit Test coverage for new store and composable logic.
