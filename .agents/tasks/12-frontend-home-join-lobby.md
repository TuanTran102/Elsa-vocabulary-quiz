# Task 12: Frontend — Home, Join PIN & Lobby Screens

## Context
The old flow (browsing a quiz list) is replaced by a PIN-based join flow. Players land on a home page, choose to join, enter a 6-digit PIN to validate the room, enter a nickname, and wait in a lobby until the master starts the game.

## Objective
Build `HomePage`, `JoinPage`, and `LobbyPage` with full Pinia state management, socket integration, and real-time player list updates.

## Acceptance Criteria

### HomePage (`/`)
- [ ] Two clear calls-to-action: **"Host a Quiz"** → `/create` and **"Join a Quiz"** → `/join`
- [ ] Premium visual design: gradient background, animated elements, bold typography
- [ ] No data fetching required on this page

### JoinPage (`/join`)
- [ ] A numeric PIN input field (6 digits, mobile-friendly: `inputmode="numeric"`)
- [ ] Client-side validation: exactly 6 digits, numeric only
- [ ] On valid PIN input (auto-submit or "Next" button): calls `GET /api/v1/sessions/:pin`
  - On success: reveal a **nickname input field**
  - On failure (404 / error): show inline error "Room not found or already started"
- [ ] Nickname field: min 2 chars, max 20 chars
- [ ] On nickname submit: emit `join_quiz { pin, nickname }` via socket
- [ ] On receiving `join_confirmed`: navigate to `/lobby/:pin`
- [ ] Show loading spinner during API call and socket emit

### LobbyPage (`/lobby/:pin`)
- [ ] Display the PIN prominently (large text, easy to read/share)
- [ ] Show a live list of joined players — updates in real-time via `player_joined` / `player_left` socket events
- [ ] Each player shown with a randomly assigned emoji avatar (assigned client-side by playerId hash)
- [ ] Live player count badge
- [ ] Status message: "Waiting for the host to start the quiz…"
- [ ] Animated player entry (slide + fade in)
- [ ] On receiving `quiz_started` socket event → navigate to `/play/:pin`
- [ ] On receiving `host_disconnected` → show modal "The host has disconnected"

### Pinia Stores (New)

**`userStore`** (`src/store/user.ts`):
```typescript
interface UserState {
  nickname: string;
  role: 'master' | 'player' | null;
  playerId: string | null;
  pin: string | null;
}
// Actions: setNickname, setRole, setPlayerId, setPin, reset
```

**`sessionStore`** (`src/store/session.ts`):
```typescript
interface SessionState {
  pin: string | null;
  gameRoomId: string | null;
  quizTitle: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | null;
  players: Array<{ nickname: string; playerId: string }>;
}
// Actions: setSession, addPlayer, removePlayer, setStatus, reset
```

### Socket Composable Updates
- [ ] Handle `player_joined` → `sessionStore.addPlayer()`
- [ ] Handle `player_left` → `sessionStore.removePlayer()`
- [ ] Handle `quiz_started` → navigate to `/play/:pin`
- [ ] Handle `join_confirmed` → `userStore.setPlayerId()`, `sessionStore.setSession()`

### Vue Router Updates
- [ ] Add routes: `/`, `/join`, `/lobby/:pin`
- [ ] Remove old `/` lobby route (quiz list browsing)
- [ ] Add navigation guard on `/lobby/:pin` and `/play/:pin`: redirect to `/join` if `userStore.pin` is null

### TDD Requirements
- Unit tests for `userStore` and `sessionStore` (all actions + state transitions)
- Component tests for `JoinPage`: PIN validation, error display, two-step flow (PIN then nickname)
- Component tests for `LobbyPage`: player list rendering, real-time player_joined handling, navigation on quiz_started

## Files to Create / Modify
- `src/views/HomePage.vue` (new)
- `src/views/JoinPage.vue` (new)
- `src/views/LobbyPage.vue` (new)
- `src/store/user.ts` (new)
- `src/store/session.ts` (new)
- `src/router/index.ts` (update routes + guards)
- `src/composables/useSocket.ts` (add new event handlers)
- `src/__tests__/views/JoinPage.spec.ts` (new)
- `src/__tests__/views/LobbyPage.spec.ts` (new)
- `src/__tests__/store/user.spec.ts` (new)
- `src/__tests__/store/session.spec.ts` (new)

## Dependencies
- Task 09 (Session REST API — PIN validation endpoint) ✅
- Task 10 (Backend `join_quiz` event) ✅
- Task 07 (Frontend foundation) ✅

## Estimated Effort: Large (6–8h)
