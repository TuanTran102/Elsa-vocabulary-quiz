# Task 13: Frontend — Host Dashboard (Master View) Plan

The objective is to implement the complete master experience, from quiz selection to real-time game control and final results dashboard.

## User Requirements
- Master can select a quiz from a list.
- Master can create a session and receive a PIN.
- Master can monitor joined players in a waiting room.
- Master can start, monitor, and end the quiz.
- Master can view final results and export them.
- Master can reconnect if the session is still active using a stored token.
- **QR Code**: Display a QR code in the waiting room for easy joining.

## Implementation Steps

### 1. State Management & API Integration
- **Extend `sessionStore`**:
  - Add `masterToken: string | null` to the state.
  - Add `setMasterToken(token: string)` action.
  - Persist `masterToken` in `localStorage` when set.
- **TDD**: 
  - Update `src/__tests__/store/session.spec.ts` to test `masterToken` management and persistence.

### 2. Router Configuration
- **Add Routes**:
  - `/create`: `CreatePage.vue`
  - `/host/:pin`: `HostDashboard.vue`
- **Navigation Guard**:
  - Add logic to handle `masterToken` based access to `/host/:pin`.
  - If a player tries to access `/host/:pin` without a valid `masterToken`, redirect to `/create`.

### 3. Create Page (`CreatePage.vue`)
- **UI**:
  - Fetch available quizzes from `GET /api/v1/quizzes`.
  - Display quizzes as cards with title and question count.
  - Loading spinner during API fetch.
  - Error message display if fetch fails.
- **Logic**:
  - `onQuizSelect`: `POST /api/v1/sessions { quiz_id }`.
  - Store received `pin`, `game_room_id`, and `masterToken` in `sessionStore`.
  - Navigate to `/host/:pin`.
- **TDD**:
  - Test rendering of quiz list.
  - Test loading/error states.
  - Test session creation flow and navigation.

### 4. Host Dashboard - Phase 1: Waiting Room
- **UI**:
  - Display PIN prominently.
  - "Copy PIN" button.
  - **QR Code**: Render a QR code pointing to `${window.location.origin}/join?pin=${pin}`.
  - Player list with count badge.
  - "Start Quiz" button (disabled if no players).
- **Socket Integration**:
  - Handle `player_joined` and `player_left` to update the player list.
- **TDD**:
  - Test Start button disabled/enabled logic.
  - Test player list updates.
  - Test QR code rendering.

### 5. Host Dashboard - Phase 2: In-Game Controls
- **UI**:
  - Current question display (Text, Number/Total).
  - Sync countdown timer from `question_started` event.
  - **Live Answer Chart**: Vertical bar chart using **Chart.js** showing player choice distribution.
  - Mini leaderboard showing top 5 players.
  - "End Quiz" button with confirmation dialog.
- **Socket Integration**:
  - Emit `start_quiz { pin }`.
  - Listen for `question_started`, `question_ended`, `leaderboard_update`.
  - Emit `end_quiz { pin }`.
- **TDD**:
  - Test timer synchronization.
  - Test phase transition from waiting to in_progress.

### 6. Host Dashboard - Phase 3: Post-Game Results
- **UI**:
  - Full leaderboard ranking.
  - Podium highlights for top 3 (medal icons).
  - "Host Another Quiz" button (redirects to `/create`).
  - **Export Results**: Generate and download a CSV containing **Nickname** and **Score** for all players.
- **Socket Integration**:
  - Listen for `quiz_completed`.
- **TDD**:
  - Test final leaderboard display.
  - Test navigation back to create page.
  - Test CSV generation logic.

### 7. Master Reconnect Logic
- **Logic**:
  - In `HostDashboard` `onMounted`, if `masterToken` is in `localStorage` but socket is not host, emit `reclaim_host { pin, masterToken }`.
  - Handle success/failure of reclaim.

## UI/UX Design (Rich Aesthetics)
- **Theme**: Dark mode with vibrant accent colors (Cyan for Master controls).
- **Charts**: Use `Chart.js` for professional, animated data visualization.
- **Animations**: 
  - Smooth transitions between phases.
  - Hover effects on quiz cards.
  - Animated leaderboard updates.
- **Icons**: Use Phosphor or FontAwesome for medals, copy, and export icons.

## Technical Details
- **Store**: Pinia (`sessionStore`).
- **Composables**: `useSocket` for event handling.
- **Libraries**: `qrcode.vue` (QR codes), `Chart.js` (Visualizations).
- **Testing**: `vitest` + `@vue/test-utils`.

## Clarifications Resolved
1. CSV Export will include only **Nickname** and **Score**.
2. **Chart.js** will be used for the answer distribution chart.
3. **QR Code** will be implemented in Phase 1 (Waiting Room).
