# Task 4: Real-time Gateway (Base)

**Relevant Docs:**
- `system_design.md`: WebSocket / PubSub architecture.
- `api_design.md`: Section 2 (WebSocket Events).

## Objective
Set up the real-time communication foundation using Socket.io and partition users into specific quiz rooms.

## Detailed Steps

1. **Socket.io + Redis Adapter Setup**:
   - Initialize the Socket.io server in the Express backend.
   - Configure the `@socket.io/redis-adapter` using an `ioredis` client to support future horizontal scaling.

2. **Quiz Gateway (`src/modules/realtime/quiz.gateway.ts`)**:
   - Create a namespace `/live-quiz`.
   - Implement a listener for the `join_quiz` event which expects a `{ quiz_id }`.

3. **Room Management**:
   - Use `socket.join(quiz_id)` to group users belonging to the same quiz session.
   - Verify if the `quiz_id` exists in the database before allowing entry.

4. **Join Broadcast**:
   - Emit a `participant_joined` event to all users in the room, including the current count of participants.

## Acceptance Criteria
- [ ] WebSocket handshake is successful from a test client.
- [ ] Users are successfully partitioned into rooms by `quiz_id`.
- [ ] `participant_joined` event is received by all clients in the same room.
