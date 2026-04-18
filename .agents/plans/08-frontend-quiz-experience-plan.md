# Plan: 08 Frontend Quiz Experience & UI

## Objective
Implement the interactive quiz interface and real-time leaderboard visualization, following TDD.

## Overview
This task completes the core user experience by providing the `QuizRoom.vue` interface where the vocabulary quiz takes place. The user will be able to see the current question, answers, timer, and a real-time updating leaderboard. The implementation will rely on the Pinia store for state and the Socket.io composable for communication.

## Implementation Steps

### Step 1: UI Component Design & Skeleton
1. **Goal**: Set up the `QuizRoom.vue` basic structure.
2. **Logic**:
   - Create `src/views/QuizRoom.vue`.
   - Setup `<script setup>` with imports for Pinia store, Socket composable, and PrimeVue components (e.g., Button, DataTable, ProgressBar, Toast).
   - Scaffold the template into three main sections: Top Bar (Timer/Status), Main Content (Question & Answer Options), and Sidebar/Lower Section (Leaderboard).
3. **Tests**:
   - Create `src/__tests__/views/QuizRoom.test.ts`.
   - Write tests to verify the component renders.
   - Verify it displays a loading or waiting state if the status is `waiting`.

### Step 2: Displaying Question and Timer
1. **Goal**: Render the active quiz question and countdown timer.
2. **Logic**:
   - Bind to `quizStore.status`, `quizStore.currentQuestion`, and `quizStore.timeRemaining`.
   - When status is `in_progress`, display the question text.
   - Show the timer using a PrimeVue `ProgressBar` or simple text indicator that visually updates as `timeRemaining` ticks down.
3. **UI/Aesthetics**: Style the question prominently with modern typography and a subtle shadow (glassmorphism if applicable). Make it visually premium.
4. **Tests**:
   - Mock store state to have a current question and an active timer.
   - Verify the question text and options are rendered.
   - Verify the timer display is visible and bound correctly.

### Step 3: Handling User Answers
1. **Goal**: Allow users to submit answers and prevent double-clicks.
2. **Logic**:
   - Create a method `submitAnswer(optionId: string)`.
   - When an option is clicked, call `submitAnswer`.
   - The method should call `socket.emit('submit_answer', { optionId })`.
   - Add a local state `isAnswering` or check if an option was already selected (e.g. `selectedOption`) to visually disable the buttons and indicate loading/selection.
   - Use a PrimeVue `Toast` component to show feedback when the server confirms points earned.
3. **Tests**:
   - Simulate a user clicking an answer option button.
   - Verify that the `emit` function is called with the correct `submit_answer` event and payload.
   - Verify buttons become disabled immediately after clicking an option.

### Step 4: Real-time Leaderboard Component
1. **Goal**: Display the leaderboard using a PrimeVue `DataTable`.
2. **Logic**:
   - Bind the DataTable to `quizStore.leaderboard`.
   - Define columns for `Rank`, `Player`, and `Score`.
   - Use pure CSS and Vue `<transition-group>` to smoothly animate row changes when players' ranks swap, fulfilling the "live" feel requirement.
3. **Tests**:
   - Mock the store's `leaderboard` with fake player data.
   - Verify the `DataTable` renders the correct number of rows and displays the correct player names and scores.

### Step 5: Post-Quiz State (Finish Screen)
1. **Goal**: Show a proper "Finish" screen when the quiz concludes.
2. **Logic**:
   - When `quizStore.status` is `completed`, hide the questions.
   - Show the final leaderboard prominently.
   - Add a "Play Again" button that resets the state and redirects back to the `/lobby` route via Vue Router.
3. **Tests**:
   - Change store status mock to `completed`.
   - Verify the Finish screen elements (final leaderboard, "Back to Lobby" button) are rendered.
   - Verify the question elements are no longer rendered.
