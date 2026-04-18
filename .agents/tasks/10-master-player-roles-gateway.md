# Task 10: Master / Player Role System in Gateway

## Context
The current `QuizGateway` treats all socket connections identically. The new flow requires clear role separation: a **Master** who controls the game and **Players** who participate. Only the master can emit control events (`start_quiz`, `end_quiz`). Players join using a PIN + nickname and receive a guest `playerId`.

## Objective
Refactor `QuizGateway` to support role-based WebSocket handling — including master socket registration, player join flow with nickname, and permission guards for control events.

## Acceptance Criteria

### Master Connection Flow
- [ ] Event `create_quiz_session { quiz_id }`:
  - Calls `SessionService.createSession(quiz_id)`
  - Sets `socket.data = { role: 'master', pin, gameRoomId }`
  - Calls `socket.join(pin)` to enter the room
  - Replies `session_created { pin, game_room_id, quiz_title }` to master only
- [ ] `masterSocketId` is stored in the Redis session so future control events can be validated

### Player Join Flow
- [ ] Event `join_quiz { pin, nickname }`:
  - Validates that `pin` exists and `session.status === 'waiting'`
  - Generates a new `playerId` (UUID)
  - Sets `socket.data = { role: 'player', playerId, nickname, pin }`
  - Calls `socket.join(pin)`
  - Calls `SessionService.addPlayer(pin, playerSession)`
  - Initializes player score in Redis ZSET: `ZADD session:{pin}:scores 0 {playerId}`
  - Emits `join_confirmed { playerId, nickname, players[] }` back to the joining player
  - Broadcasts `player_joined { nickname, player_count, players[] }` to the whole room
- [ ] Rejects join if session status is `in_progress` or `completed` with `error` event

### Control Events (Master Only)
- [ ] `start_quiz { pin }` — guarded: only processed if `socket.id === session.masterSocketId`
- [ ] `next_question { pin }` — guarded: master only (used if manual advance is enabled)
- [ ] `end_quiz { pin }` — guarded: master only

### Disconnect Handling
- [ ] On player disconnect: call `SessionService.removePlayer`, broadcast `player_left { nickname, player_count }` to room
- [ ] On master disconnect: broadcast `host_disconnected` to all players in room

### MasterGuard
- [ ] Create a `MasterGuard` utility (pure function or class) that compares `socket.data.role` and `socket.id` against the stored `masterSocketId` in Redis
- [ ] All master-only handlers use this guard before executing

### TDD Requirements
- Unit tests for all event handlers using mocked `SessionService`
- Test unauthorized role rejection (player attempting `start_quiz`)
- Test invalid PIN rejection
- Test player join with `in_progress` session returns error
- Test disconnect cleanup broadcasts

## Files to Create / Modify
- `src/modules/realtime/gateways/quiz.gateway.ts` (major refactor)
- `src/modules/realtime/guards/master.guard.ts` (new)
- `src/modules/realtime/types/socket.types.ts` (new — extend `Socket` with `data` typings)
- `src/__tests__/modules/realtime/gateways/quiz.gateway.test.ts` (major refactor)
- `src/__tests__/modules/realtime/guards/master.guard.test.ts` (new)

## Dependencies
- Task 09 (SessionService) ✅
- Task 04 (Gateway base) ✅
- Task 05 (Scoring engine) ✅

## Estimated Effort: Large (5–6h)
