# Plan: Task 4 - Real-time Gateway (Base)

This plan outlines the setup of the real-time communication foundation for the Elsa Vocabulary Quiz, focusing on Socket.io configuration, namespace management, and room partitioning.

## 1. Objectives
- Refactor and stabilize Socket.io configuration with Redis adapter.
- Implement the `/live-quiz` namespace and `QuizGateway`.
- Implement `join_quiz` logic with database validation.
- Implement room-based broadcasting for new participants.

## 2. Proposed Changes

### 2.1 Backend Core (`src/core/socket/`)
- `src/core/socket/socket.server.ts`: Dedicated service to initialize `Socket.io` and attach gateways.

### 2.2 Backend Realtime Module (`src/modules/realtime/`)
- `src/modules/realtime/quiz.gateway.ts`: Implementation of the `/live-quiz` events.
- `src/modules/realtime/socket.middleware.ts`: Middleware for authenticating socket connections.

### 2.3 Backend Integration
- `src/server.ts`: Update to utilize the refactored socket initialization logic.

## 3. Implementation Steps

### Phase 1: Socket Infrastructure Refactoring (TDD)
1. **Test**: Enhance existing integration tests or create `src/__tests__/core/socket/socket.server.test.ts`.
   - Verify `io` instance creation.
   - Verify Redis adapter is active (if test environment allows, or mock it).
2. **Implement**: Create `src/core/socket/socket.server.ts`.
   - Move `Server` initialization out of `server.ts`.
   - Setup CORS and Redis adapter.

### Phase 2: Socket Authentication (TDD)
1. **Test**: Create `src/__tests__/modules/realtime/socket.middleware.test.ts`.
   - Mock a socket connection with/without `Authorization` header.
   - Verify it correctly identifies users or rejects unauthorized connections.
2. **Implement**: Create `src/modules/realtime/socket.middleware.ts`.
   - Extract `user_id` from handshake headers (simulating the `dummyAuth` logic).

### Phase 3: Quiz Gateway & Room Management (TDD)
1. **Test**: Create `src/__tests__/modules/realtime/quiz.gateway.test.ts`.
   - Use `socket.io-client` to simulate participants.
   - **Test 1**: Connection to `/live-quiz` namespace.
   - **Test 2**: `join_quiz` event with valid `quiz_id`.
     - Mock `QuizRepository.findById` to return a quiz.
     - Verify socket joins the room named `quiz_[quiz_id]`.
     - Verify client receives `quiz_joined` acknowledgment.
   - **Test 3**: `join_quiz` event with invalid `quiz_id`.
     - Verify failure response or no room join.
   - **Test 4**: Broadcast `participant_joined`.
     - Client A is in room. Client B joins.
     - Verify Client A receives `participant_joined` with `total_participants`.
2. **Implement**: Create `src/modules/realtime/quiz.gateway.ts`.
   - Implement `onConnection` for `/live-quiz`.
   - Implement `join_quiz` handler:
     - Validate `quiz_id` via `QuizRepository`.
     - Map socket to user (via auth middleware).
     - `socket.join(`quiz_${quiz_id}`)`.
     - Emit `quiz_joined` to current socket.
     - Broadcast `participant_joined` to room.

### Phase 4: Integration
1. **Update**: `src/server.ts` to use `SocketServer.init(server)`.
2. **Ensure**: `QuizGateway` is registered to the `io` instance.

## 4. Acceptance Criteria Verification
- [ ] WebSocket handshake is successful from a test client to `/live-quiz`.
- [ ] Users are successfully partitioned into rooms by `quiz_id`.
- [ ] `participant_joined` event is received by all clients in the same room.
- [ ] `total_participants` correctly reflects the number of sockets in the room.

## 5. Clarification Needed
- **Room Naming**: I will use `quiz_${quiz_id}` as the room ID prefix to avoid collisions.
- **Participant Tracking**: I will use `io.of('/live-quiz').adapter.rooms.get(roomName).size` to get the participant count. Since we use the Redis adapter, this count should be synchronized across instances.
- **Repository Injection**: I will need to ensure `QuizRepository` (from Task 3) is available for injection or instantiation within the gateway.
