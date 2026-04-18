# Task 7: Frontend Foundation & State

**Relevant Docs:**
- `detail_design.md`: Section 2 (Frontend App Structure & Vue Components).

## Objective
Initialize the frontend state management and real-time connectivity layer.

## Detailed Steps

1. **State Management (Pinia)**:
   - Define `useQuizStore` in `src/store/quiz.ts`.
   - State should include: `currentQuiz`, `questions`, `participantsCount`, `leaderboard`, and `userScore`.

2. **Socket Composable (`src/composables/useSocket.ts`)**:
   - Implement a Vue Composable using `socket.io-client`.
   - Features: connect, emit events, and listen for global events (participant joined, leaderboard update).

3. **Lobby View (`src/views/Lobby.vue`)**:
   - Fetch the list of quizzes from `GET /api/v1/quizzes`.
   - Render quiz cards with "Join" buttons that redirect to the quiz room.

## Acceptance Criteria
- [ ] Pinia store updates correctly when fetching quiz data.
- [ ] Socket connection is established when the app loads.
- [ ] Lobby view displays the seeded quizzes correctly.
