# Implementation Plan: 12-frontend-home-join-lobby

Build the frontend flow for joining a quiz room using a PIN. This includes the Home Page, Join Page (multi-step PIN/Nickname), and the Lobby Page where players wait for the host.

## 1. Store Implementation (TDD)

### A. User Store (`src/store/user.ts`)
- **State**: `nickname`, `role`, `playerId`, `pin`.
- **Actions**: `setNickname`, `setRole`, `setPlayerId`, `setPin`, `reset`.
- **Logic**: Manage global user identity and role within a session.
- **Tests**: `src/__tests__/store/user.spec.ts`
  - Verify each action correctly updates state.
  - Verify `reset()` clears all fields.

### B. Session Store (`src/store/session.ts`)
- **State**: `pin`, `gameRoomId`, `quizTitle`, `status`, `players` (array of player objects).
- **Actions**: `setSession`, `addPlayer`, `removePlayer`, `setStatus`, `reset`.
- **Logic**: Track current game room state and connected players.
- **Tests**: `src/__tests__/store/session.spec.ts`
  - Verify adding/removing players (prevent duplicates, handle non-existent players).
  - Verify state transitions (waiting -> in_progress).

## 2. Router & Global Integration

### A. View Router (`src/router/index.ts`)
- Define routes:
  - `/` -> `HomePage`
  - `/join` -> `JoinPage`
  - `/lobby/:pin` -> `LobbyPage`
- **Navigation Guard**:
  - For routes `/lobby/:pin` and `/play/:pin`: 
    1. Check if `userStore.pin` matches the route `:pin`.
    2. CALL API `GET /api/v1/sessions/:pin` to verify the room still exists and has not finished.
    3. If invalid or missing, redirect to `/join`.
- Remove old `/` (Lobby.vue) route.

### B. Socket Composable (`src/composables/useSocket.ts`)
- Add listener mappings to store actions:
  - `player_joined` -> update `sessionStore`.
  - `player_left` -> update `sessionStore`.
  - `quiz_started` -> router navigation to `/play/:pin`.
  - `join_confirmed` -> update both `userStore` and `sessionStore`.
  - `host_disconnected` -> trigger event for `LobbyPage`.

## 3. UI Components Implementation (TDD)

### A. Join Page (`src/views/JoinPage.vue`)
- **Tests**: `src/__tests__/views/JoinPage.spec.ts`
  - Assert that PIN field only accepts numeric input.
  - Mock API response for PIN validation (Success/Failure cases).
  - Verify step transition: PIN validation -> reveal Nickname field.
  - Verify socket emission on Nickname submit.
- **UI**: 
  - Mobile-friendly numeric input.
  - Inline error messages.
  - Loading states for API and socket calls.

### B. Lobby Page (`src/views/LobbyPage.vue`)
- **Tests**: `src/__tests__/views/LobbyPage.spec.ts`
  - Assert core data display: PIN, Player Count.
  - Mock socket events and verify DOM updates for player list.
  - Verify navigation on `quiz_started`.
- **UI**:
  - Prominent PIN display.
  - Player list (Nickname only, no emojis).
  - Animated entry/exit of players.

### C. Home Page (`src/views/HomePage.vue`)
- **UI**:
  - Hero section with gradient background.
  - Clear "Host" and "Join" CTAs.
  - Micro-animations for button hovers and reveal.

## 4. Design & Aesthetics
- Use vibrant gradients (e.g., Indigo to Purple).
- Implement glassmorphism for containers on Join/Lobby pages.
- Standardize typography (G-Fonts: Inter/Outfit).
- Ensure mobile responsiveness for all screens.

## 5. Verification Checklist
- [ ] 100% test coverage for new stores.
- [ ] Join flow: Correct handling of invalid PIN (404).
- [ ] Lobby flow: Real-time sync with backend socket events.
- [ ] Navigation Guard: API-based session validation working.
- [ ] Premium "Wow" factor in design.
