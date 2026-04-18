# Implementation Plan - Task 10: Master / Player Role System in Gateway

This task involves refactoring the existing `QuizGateway` to support a role-based architecture (Master and Player) as part of the Slido-inspired real-time quiz flow.

## TDD Approach
- **Unit Tests First**: Every new feature or refactor will start with a test file or test case.
- **Mocking**: Use `jest-mock-extended` to mock dependencies like `SessionService`, `QuizRepository`, `LeaderboardService`, and `QuizAnswerService`.
- **Socket Testing**: Utilize `socket.io-client` in tests to simulate real WebSocket connections and events if needed, or mock the `Socket` and `Server` objects for pure unit testing of handlers.

## 1. Foundation and Typings
- **Goal**: Establish the structure and type safety for the role system.
- **Actions**:
  - Update `src/modules/session/session.types.ts` to include `masterSocketId` and `players` array/count in `GameSession`.
  - Create `src/modules/realtime/types/socket.types.ts` to extend `Socket.data` with `role`, `pin`, `playerId`, `nickname`, and `gameRoomId`.
  - Create directory `src/modules/realtime/gateways/` and move `src/modules/realtime/quiz.gateway.ts` to `src/modules/realtime/gateways/quiz.gateway.ts`.
  - Create directory `src/modules/realtime/guards/`.

## 2. Extend SessionService
- **Goal**: Add missing functionality required by the role system.
- **Methods to Add**:
  - `addPlayer(pin, playerSession)`: Add player to Redis session and broadcast if needed.
  - `removePlayer(pin, playerId)`: Remove player from Redis session.
  - `setMasterSocket(pin, socketId)`: Store the master's socket ID in the Redis session.
- **Tests**:
  - Verify player list updates in Redis.
  - Verify master socket ID persistence.

## 3. MasterGuard Implementation
- **Goal**: Provide a reusable mechanism to restrict events to the session master.
- **Logic**:
  - Fetch session from Redis using the provided PIN (from socket.data or payload).
  - Compare `socket.id` with `session.masterSocketId`.
  - Verify `socket.data.role === 'master'`.
- **Tests**:
  - Should allow access if socket is the registered master.
  - Should reject if socket is a player.
  - Should reject if session does not exist.

## 4. QuizGateway Refactor - Master Flow
- **Goal**: Allow masters to initialize a room.
- **Handler**: `create_quiz_session { quiz_id }`
- **Logic**:
  - Call `SessionService.createSession(quiz_id)`.
  - Call `SessionService.setMasterSocket(pin, socket.id)`.
  - Assign `role: 'master'` and metadata to `socket.data`.
  - Join the socket to the room identified by PIN.
  - Emit `session_created { pin, game_room_id, quiz_title }`.
- **Tests**:
  - Successful session creation and master registration.

## 5. QuizGateway Refactor - Player Flow
- **Goal**: Allow players to join an existing session using a PIN.
- **Handler**: `join_quiz { pin, nickname }`
- **Logic**:
  - Validate PIN existence and 'WAITING' status via `SessionService`.
  - Generate UUID `playerId`.
  - Assign `role: 'player'` and metadata to `socket.data`.
  - Join socket to PIN room.
  - Call `SessionService.addPlayer(pin, { playerId, nickname })`.
  - Initialize score (0) in Redis ZSET `session:{pin}:scores` for `playerId`.
  - Emit `join_confirmed { playerId, nickname, players[] }`.
  - Broadcast `player_joined { nickname, player_count, players[] }`.
- **Tests**:
  - Successful join with valid PIN.
  - Rejection if session is not waiting.
  - Verify ZSET initialization.

## 6. Control Events & Disconnect Handling
- **Goal**: Secure game control and handle clean-up.
- **Handlers**: `start_quiz`, `next_question`, `end_quiz`. (Apply `MasterGuard`)
- **Disconnect Logic**:
  - If `socket.data.role === 'master'`: Broadcast `host_disconnected` to room.
  - If `socket.data.role === 'player'`: Call `SessionService.removePlayer`, broadcast `player_left`.
- **Tests**:
  - Unauthorized control event rejection.
  - Role-based disconnect cleanup.

## 6. Cleanup and Migration
- Remove old `join_quiz` logic that relied on `user_id`.
- Ensure all imports use `.js` extension for ESM compatibility.

## 7. Architecture Decisions (Finalized)
- **MasterGuard**: Implemented as a utility helper function/class within `src/modules/realtime/guards/`.
- **Relocation**: `QuizGateway` will be moved to `src/modules/realtime/gateways/` to ensure a cleaner directory structure.
- **Anonymity**: The system will exclusively use PIN + Nickname. Previous `user_id` logic from standard auth will be bypassed/removed for real-time quiz sessions to support quick guest entry.
